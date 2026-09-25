import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  SundaySchoolAttendance,
  SundaySchoolAttendanceDocument,
} from 'src/schemas/sundaySchool/attendance.schema';
import { calculatePagination } from 'src/dtos/pagination.dto';

export interface AttendanceReportFilters {
  levelIds: string[];
  startDate: Date;
  endDate: Date;
  levelId?: string;
  service?: string;
  teacherId?: string;
  page?: number;
  limit?: number;
}

export interface AttendanceReportStudent {
  studentId: string;
  hasAttended: boolean;
  fullName?: string;
}

export interface AttendanceReportRow {
  date: Date;
  service: string;
  levelId: string;
  levelName?: string;
  teacherId: string;
  teacherName?: string;
  lessonName?: string;
  attendeesCount: number;
  students: AttendanceReportStudent[];
}

export interface AttendanceReportResult {
  records: AttendanceReportRow[];
  totalRecords: number;
  byService: { service: string; total: number }[];
  byLevel: { levelId: string; levelName?: string; total: number }[];
  summary: {
    totalAttendees: number;
    totalSundays: number;
    totalLevels: number;
    totalServices: number;
  }[];
}

@Injectable()
export class SundaySchoolReportProvider {
  constructor(
    @InjectModel(SundaySchoolAttendance.name)
    private readonly attendanceModel: Model<SundaySchoolAttendanceDocument>,
  ) {}

  /**
   * Builds the attendance report for the given filters. The church scoping is
   * applied through the level IDs of the church (attendance records do not
   * store churchId). Each record counts only the students whose
   * hasAttended flag is true.
   */
  async getAttendanceReport(
    filters: AttendanceReportFilters,
  ): Promise<AttendanceReportResult> {
    // levelId/teacherId are stored as ObjectId in the attendance collection,
    // so the string filters must be cast to ObjectId before matching.
    const match: FilterQuery<SundaySchoolAttendanceDocument> = {
      levelId: {
        $in: filters.levelIds.map((id) => new Types.ObjectId(id)),
      },
      date: { $gte: filters.startDate, $lte: filters.endDate },
    };

    if (filters.levelId) {
      match.levelId = new Types.ObjectId(filters.levelId);
    }

    if (filters.service) {
      match.service = filters.service;
    }

    if (filters.teacherId) {
      match.teacherId = new Types.ObjectId(filters.teacherId);
    }

    const { skip, limit } = calculatePagination({
      page: filters.page,
      limit: filters.limit,
    });

    const [result] = await this.attendanceModel.aggregate([
      { $match: match },
      {
        $addFields: {
          attendeesCount: {
            $size: {
              $filter: {
                input: '$studentsAttendance',
                as: 'sa',
                cond: { $eq: ['$$sa.hasAttended', true] },
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'levels',
          localField: 'levelId',
          foreignField: '_id',
          as: 'level',
        },
      },
      { $unwind: { path: '$level', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'members',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher',
        },
      },
      { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'students',
          localField: 'studentsAttendance.studentId',
          foreignField: '_id',
          as: 'students',
        },
      },
      {
        $facet: {
          records: [
            {
              $project: {
                _id: 0,
                date: 1,
                service: 1,
                levelId: 1,
                levelName: '$level.name',
                teacherId: 1,
                teacherName: '$teacher.fullName',
                lessonName: 1,
                attendeesCount: 1,
                students: {
                  $map: {
                    input: '$studentsAttendance',
                    as: 'sa',
                    in: {
                      studentId: '$$sa.studentId',
                      hasAttended: '$$sa.hasAttended',
                      fullName: {
                        $let: {
                          vars: {
                            student: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: '$students',
                                    as: 's',
                                    cond: {
                                      $eq: ['$$s._id', '$$sa.studentId'],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: {
                            $trim: {
                              input: {
                                $concat: [
                                  { $ifNull: ['$$student.name', ''] },
                                  ' ',
                                  { $ifNull: ['$$student.lastName', ''] },
                                ],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            { $sort: { date: -1, service: 1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          totalRecords: [{ $count: 'total' }],
          byService: [
            {
              $group: {
                _id: '$service',
                total: { $sum: '$attendeesCount' },
              },
            },
            {
              $project: {
                _id: 0,
                service: '$_id',
                total: 1,
              },
            },
            { $sort: { service: 1 } },
          ],
          byLevel: [
            {
              $group: {
                _id: '$levelId',
                levelName: { $first: '$level.name' },
                total: { $sum: '$attendeesCount' },
              },
            },
            {
              $project: {
                _id: 0,
                levelId: '$_id',
                levelName: 1,
                total: 1,
              },
            },
            { $sort: { total: -1 } },
          ],
          summary: [
            {
              $group: {
                _id: null,
                totalAttendees: { $sum: '$attendeesCount' },
                sundays: { $addToSet: '$date' },
                levels: { $addToSet: '$levelId' },
                services: { $addToSet: '$service' },
              },
            },
            {
              $project: {
                _id: 0,
                totalAttendees: 1,
                totalSundays: { $size: '$sundays' },
                totalLevels: { $size: '$levels' },
                totalServices: { $size: '$services' },
              },
            },
          ],
        },
      },
    ]);

    return {
      records: result?.records || [],
      totalRecords: result?.totalRecords?.[0]?.total ?? 0,
      byService: result?.byService || [],
      byLevel: result?.byLevel || [],
      summary: result?.summary || [],
    };
  }
}
