import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

/**
 * Enrollment of a student in a Sunday School level.
 * Level history lives here; students.levelId is kept only as a denormalized
 * cache of the active enrollment for fast filtering and reporting.
 */
@Schema({ collection: 'levelEnrollments', timestamps: true })
export class LevelEnrollment {
  _id: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Students',
  })
  studentId: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
  })
  levelId: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Church',
  })
  churchId: mongoose.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  startDate: Date;

  @Prop({ type: Date, default: null })
  endDate?: Date;

  @Prop({
    required: true,
    enum: ['active', 'promoted', 'graduated', 'withdrawn'],
    default: 'active',
  })
  status: 'active' | 'promoted' | 'graduated' | 'withdrawn';

  @Prop()
  comments?: string;
}

export type LevelEnrollmentDocument = LevelEnrollment & mongoose.Document;

export const LevelEnrollmentSchema =
  SchemaFactory.createForClass(LevelEnrollment);

LevelEnrollmentSchema.index({ studentId: 1, status: 1 });
LevelEnrollmentSchema.index({ levelId: 1, status: 1 });
LevelEnrollmentSchema.index({ churchId: 1, createdAt: -1 });
LevelEnrollmentSchema.index(
  { studentId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' },
    name: 'level_enrollments_one_active_student',
  },
);
