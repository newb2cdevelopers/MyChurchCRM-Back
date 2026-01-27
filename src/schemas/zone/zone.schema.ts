import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as mongoose from 'mongoose';

@Schema()
export class Zone {
  _id: number;


  @ApiProperty({ example: 'zone name' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ example: '["679d017daf1fff94edac0c1a"]' })
  @Prop({type: [mongoose.Schema.Types.ObjectId], ref: 'Members' })
  coordinators: string [] 
}

export type ZoneTextDocument = Zone & mongoose.Document;

export const ZoneSchema = SchemaFactory.createForClass(Zone);

ZoneSchema.index({ name: 1 }, { unique: true });
