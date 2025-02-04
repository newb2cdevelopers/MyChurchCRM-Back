import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Neighborhood {
  _id: number;

  @Prop({ required: true })
  name: string;

  @Prop({type: [mongoose.Schema.Types.ObjectId], ref: 'Locality' })
  locality: string [] 
}

export type NeighborhoodTextDocument = Neighborhood & mongoose.Document;

export const NeighborhoodSchema = SchemaFactory.createForClass(Neighborhood);

NeighborhoodSchema.index({ name: 1 }, { unique: true });
