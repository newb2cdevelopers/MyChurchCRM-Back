import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Students {
  _id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  documentType: string;

  @Prop({ required: true })
  documentNumber: string;

  @Prop({ required: true })
  birthDate: Date;

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

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Level' })
  levelId: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Church' })
  churchId: string;
}

export type StudentDocument = Students & mongoose.Document;

export const StudentSchema = SchemaFactory.createForClass(Students);

StudentSchema.index({ documentNumber: 1, churchId: 1 }, { unique: true });
