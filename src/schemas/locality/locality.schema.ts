import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as mongoose from 'mongoose';

@Schema()
export class Locality {
  _id: number;


  @ApiProperty({ example: 'locality name' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Zone' })
  zone: string
}

export type LocalityTextDocument = Locality & mongoose.Document;

export const LocalitySchema = SchemaFactory.createForClass(Locality);

LocalitySchema.index({ name: 1 }, { unique: true });
