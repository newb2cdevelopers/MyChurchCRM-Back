import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Zone {
  _id: number;

  @Prop({ required: true })
  name: string;

  @Prop({type: [mongoose.Schema.Types.ObjectId], ref: 'Members' })
  coordinators: string [] 
}

export type ZoneTextDocument = Zone & mongoose.Document;

export const ZoneSchema = SchemaFactory.createForClass(Zone);

ZoneSchema.index({ name: 1 }, { unique: true });
