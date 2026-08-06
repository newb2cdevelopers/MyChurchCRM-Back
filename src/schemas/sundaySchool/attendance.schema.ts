import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
class StudentAttendance {
  _id: number;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Students',
  })
  studentId: string;

  @Prop({ required: true })
  hasAttended: boolean;
}

const StudentAttendanceSchema = SchemaFactory.createForClass(StudentAttendance);

@Schema({ timestamps: true })
export class SundaySchoolAttendance {
  _id: number;

  @Prop({ type: [StudentAttendanceSchema], default: [] })
  studentsAttendance: [StudentAttendance];

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Level' })
  levelId: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  lessonName: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Members',
  })
  teacherId: string;

  @Prop()
  comments: string;
}

export type SundaySchoolAttendanceDocument = SundaySchoolAttendance &
  mongoose.Document;

export const SundaySchoolAttendanceSchema = SchemaFactory.createForClass(
  SundaySchoolAttendance,
);

SundaySchoolAttendanceSchema.index({ levelId: 1, date: 1 }, { unique: true });
