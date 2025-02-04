import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Locality {
  _id: number;

  @Prop({ required: true })
  name: string;

  @Prop({type: [mongoose.Schema.Types.ObjectId], ref: 'Zone' })
  zone: string [] 
}

export type LocalityTextDocument = Locality & mongoose.Document;

export const LocalitySchema = SchemaFactory.createForClass(Locality);

LocalitySchema.index({ name: 1 }, { unique: true });
