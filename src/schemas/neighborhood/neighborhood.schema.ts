import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class Neighborhood {
  _id: number;

  @ApiProperty({ example: 'Neighborhood name' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Locality' })
  locality: string 
}

export type NeighborhoodTextDocument = Neighborhood & mongoose.Document;

export const NeighborhoodSchema = SchemaFactory.createForClass(Neighborhood);

NeighborhoodSchema.index({ name: 1 }, { unique: true });
