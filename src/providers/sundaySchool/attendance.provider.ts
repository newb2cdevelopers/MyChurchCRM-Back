import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SundaySchoolAttendance,
  SundaySchoolAttendanceDocument,
} from 'src/schemas/sundaySchool/attendance.schema';
import { RegisterAttendanceDto } from 'src/schemas/sundaySchool/attendance.DTO';

@Injectable()
export class SundaySchoolAttendanceProvider {
  constructor(
    @InjectModel(SundaySchoolAttendance.name)
    private readonly attendanceModel: Model<SundaySchoolAttendanceDocument>,
  ) {}

  async getByLevel(levelId: string): Promise<SundaySchoolAttendanceDocument[]> {
    return this.attendanceModel
      .find({ levelId })
      .populate('studentsAttendance.studentId')
      .sort({ date: -1 });
  }

  async findByLevelAndDate(
    levelId: string,
    date: string,
  ): Promise<SundaySchoolAttendanceDocument | null> {
    return this.attendanceModel.findOne({ levelId, date });
  }

  async create(
    attendance: RegisterAttendanceDto,
  ): Promise<SundaySchoolAttendanceDocument> {
    return this.attendanceModel.create(attendance);
  }

  async updateByLevelAndDate(
    levelId: string,
    date: string,
    attendance: RegisterAttendanceDto,
  ): Promise<SundaySchoolAttendanceDocument | null> {
    return this.attendanceModel.findOneAndUpdate(
      { levelId, date },
      attendance,
      { new: true },
    );
  }
}
