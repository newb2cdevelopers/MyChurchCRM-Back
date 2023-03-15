import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Church {
  _id: number;

  @Prop({ required: true })
  name: string;
}

export type ChurchTextDocument = Church & mongoose.Document;

export const ChurchSchema = SchemaFactory.createForClass(Church);

ChurchSchema.index({ name: 1 }, { unique: true });
