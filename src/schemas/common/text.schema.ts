import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class GospelTexts {
  _id: number;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  languageCode: string;

  @Prop({ required: true })
  value: string;
}

export type GospelTextDocument = GospelTexts & mongoose.Document;

export const GospelTextSchema = SchemaFactory.createForClass(GospelTexts);

GospelTextSchema.index({ key: 1, languageCode: 1 }, { unique: true });
