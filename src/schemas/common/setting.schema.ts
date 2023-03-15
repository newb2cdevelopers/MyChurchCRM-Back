import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Settings {
  _id: number;

  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  value: string;
}

export type SettingDocument = Settings & mongoose.Document;

export const SettingSchema = SchemaFactory.createForClass(Settings);

SettingSchema.index({ key: 1 });
