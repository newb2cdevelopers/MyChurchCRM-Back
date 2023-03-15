import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Functionality {
  _id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  route: string;

  @Prop({ required: true })
  active: boolean;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Role' })
  role: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Module' })
  module: string;
}

export type FunctionalityTextDocument = Functionality & mongoose.Document;

export const FunctionalitySchema = SchemaFactory.createForClass(Functionality);

FunctionalitySchema.index({ name: 1 }, { unique: true });