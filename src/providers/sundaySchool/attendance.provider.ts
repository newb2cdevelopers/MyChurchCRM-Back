import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  SundaySchoolAttendance,
  SundaySchoolAttendanceDocument,
} from 'src/schemas/sundaySchool/attendance.schema';
import { RegisterAttendanceDto } from 'src/schemas/sundaySchool/attendance.DTO';
import { PaginatedResult, calculatePagination } from 'src/dtos/pagination.dto';
import {
  withLegacyMemberFields,
  withLegacyStudentFields,
} from 'src/utils/legacy-identity.util';

@Injectable()
export class SundaySchoolAttendanceProvider {
  constructor(
    @InjectModel(SundaySchoolAttendance.name)
    private readonly attendanceModel: Model<SundaySchoolAttendanceDocument>,
  ) {}

  async getByLevel(
    levelId: string,
    page?: number,
    limit?: number,
    search?: string,
  ): Promise<PaginatedResult<SundaySchoolAttendance>> {
    const { skip } = calculatePagination({ page, limit });

    const filter: FilterQuery<SundaySchoolAttendanceDocument> = { levelId };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ lessonName: regex }, { comments: regex }];
    }

    const [data, totalRecords] = await Promise.all([
      this.attendanceModel
        .find(filter)
        .populate({
          path: 'studentsAttendance.studentId',
          populate: { path: 'personId', model: 'Person' },
        })
        .populate({
          path: 'teacherId',
          populate: { path: 'personId', model: 'Person' },
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit || 10)
        .lean(),
      this.attendanceModel.countDocuments(filter),
    ]);

    const { page: currentPage, limit: pageSize } = calculatePagination({
      page,
      limit,
    });
    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
      data: data.map((attendance) => this.withLegacyRelations(attendance)),
      metadata: { currentPage, totalPages, totalRecords },
    };
  }

  /**
   * Projects the populated student/teacher persons into the legacy flat fields
   * so attendance views keep rendering names while the frontend migrates.
   */
  private withLegacyRelations<T extends Record<string, unknown>>(
    attendance: T,
  ): T {
    const teacher = attendance.teacherId;

    const studentsAttendance = attendance.studentsAttendance;

    return {
      ...attendance,
      teacherId:
        teacher && typeof teacher === 'object'
          ? withLegacyMemberFields(teacher as { personId?: unknown })
          : teacher,
      studentsAttendance: Array.isArray(studentsAttendance)
        ? studentsAttendance.map((entry) => {
            const record = entry as Record<string, unknown>;
            const student = record.studentId;

            return {
              ...record,
              studentId:
                student && typeof student === 'object'
                  ? withLegacyStudentFields(student as { personId?: unknown })
                  : student,
            };
          })
        : studentsAttendance,
    } as T;
  }

  async findByLevelAndDate(
    levelId: string,
    date: string,
    service: string,
  ): Promise<SundaySchoolAttendanceDocument | null> {
    return this.attendanceModel.findOne({ levelId, date, service }).lean();
  }

  async create(
    attendance: RegisterAttendanceDto,
  ): Promise<SundaySchoolAttendanceDocument> {
    return this.attendanceModel.create(attendance);
  }

  async updateByLevelAndDate(
    levelId: string,
    date: string,
    service: string,
    attendance: RegisterAttendanceDto,
  ): Promise<SundaySchoolAttendanceDocument | null> {
    return this.attendanceModel
      .findOneAndUpdate({ levelId, date, service }, attendance, { new: true })
      .lean();
  }
}
