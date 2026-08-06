import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true })
export class SundaySchoolClass {
  _id: number;

  @Prop({ required: true })
  lessonName: string;

  @Prop({ required: true })
  pdfUrl: string;

  @Prop({
    required: true,
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Level',
  })
  levelIds: string[];

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Church' })
  churchId: string;
}

export type SundaySchoolClassDocument = SundaySchoolClass & mongoose.Document;

export const SundaySchoolClassSchema =
  SchemaFactory.createForClass(SundaySchoolClass);

SundaySchoolClassSchema.index({ churchId: 1, date: 1 });
