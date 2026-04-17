import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as mongoose from 'mongoose';

@Schema()
export class CompanyCategory {
  _id: number;

  @ApiProperty({ example: 'Professional Services' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ example: true })
  @Prop({ required: true, default: true })
  isActive: boolean;
}

export type CompanyCategoryDocument = CompanyCategory & mongoose.Document;

export const CompanyCategorySchema =
  SchemaFactory.createForClass(CompanyCategory);

CompanyCategorySchema.index({ name: 1 }, { unique: true });
