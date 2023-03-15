import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Languages {
  _id: number;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  selected: boolean;
}

export type LanguageDocument = Languages & mongoose.Document;

export const LanguageSchema = SchemaFactory.createForClass(Languages);

LanguageSchema.index({ key: 1 });
