import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LevelEnrollment,
  LevelEnrollmentDocument,
} from 'src/schemas/levelEnrollment/levelEnrollment.schema';

export type EnrollmentStatus =
  | 'active'
  | 'promoted'
  | 'graduated'
  | 'withdrawn';

@Injectable()
export class LevelEnrollmentProvider {
  constructor(
    @InjectModel(LevelEnrollment.name)
    private readonly enrollmentModel: Model<LevelEnrollmentDocument>,
  ) {}

  async findActiveByStudentId(
    studentId: string,
  ): Promise<LevelEnrollmentDocument | null> {
    return this.enrollmentModel.findOne({ studentId, status: 'active' }).lean();
  }

  async create(data: {
    studentId: string;
    levelId: string;
    churchId: string;
    startDate?: Date;
    comments?: string;
  }): Promise<LevelEnrollmentDocument> {
    return this.enrollmentModel.create({
      ...data,
      status: 'active',
      startDate: data.startDate || new Date(),
    });
  }

  async closeActive(
    studentIds: string[],
    status: Exclude<EnrollmentStatus, 'active'>,
  ): Promise<void> {
    if (!studentIds.length) return;

    await this.enrollmentModel.updateMany(
      { studentId: { $in: studentIds }, status: 'active' },
      { $set: { status, endDate: new Date() } },
    );
  }

  async openMany(
    studentIds: string[],
    levelId: string,
    churchId: string,
  ): Promise<void> {
    if (!studentIds.length) return;

    const now = new Date();
    await this.enrollmentModel.insertMany(
      studentIds.map((studentId) => ({
        studentId,
        levelId,
        churchId,
        status: 'active',
        startDate: now,
      })),
    );
  }

  async getActiveByLevel(levelId: string): Promise<LevelEnrollmentDocument[]> {
    return this.enrollmentModel.find({ levelId, status: 'active' }).lean();
  }
}
