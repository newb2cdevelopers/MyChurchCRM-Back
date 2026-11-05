import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Students {
  _id: number;

  @Prop({
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  })
  personId?: mongoose.Types.ObjectId;

  @Prop()
  fatherName: string;

  @Prop()
  motherName: string;

  @Prop({ required: true })
  emergencyContactName: string;

  @Prop({ required: true })
  emergencyContactPhone: string;

  @Prop()
  guardianName: string;

  @Prop()
  observations: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Level' })
  levelId?: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Church' })
  churchId: string;

  @Prop({ default: false })
  graduated: boolean;

  @Prop()
  graduatedAt?: Date;
}

export type StudentDocument = Students & mongoose.Document;

export const StudentSchema = SchemaFactory.createForClass(Students);

StudentSchema.index(
  { personId: 1, churchId: 1 },
  {
    unique: true,
    partialFilterExpression: { personId: { $exists: true } },
    name: 'students_person_church_unique',
  },
);
StudentSchema.index({ churchId: 1, levelId: 1, createdAt: -1 });
