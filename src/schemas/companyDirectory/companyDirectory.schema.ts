import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as mongoose from 'mongoose';

@Schema({ _id: false })
export class CompanyDirectorySocialNetwork {
  @ApiProperty({ example: 'Facebook' })
  @Prop({ required: true })
  Name: string;

  @ApiProperty({ example: 'https://facebook.com/my-company' })
  @Prop({ required: true })
  Profile: string;
}

const CompanyDirectorySocialNetworkSchema = SchemaFactory.createForClass(
  CompanyDirectorySocialNetwork,
);

@Schema({ _id: false })
export class CompanyDirectoryProduct {
  @ApiProperty({ example: 'Product title' })
  @Prop({ required: true, trim: true })
  title: string;

  @ApiProperty({ example: 'Product description', required: false })
  @Prop()
  description?: string;

  @ApiProperty({
    example:
      'https://res.cloudinary.com/demo/image/upload/v1713420000/mychurchcrm/companyProducts/product-image.png',
  })
  @Prop({ required: true })
  imageUrl: string;
}

const CompanyDirectoryProductSchema = SchemaFactory.createForClass(
  CompanyDirectoryProduct,
);

@Schema({ timestamps: true })
export class CompanyDirectory {
  _id: number;

  @ApiProperty({ example: 'My Company' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ example: 'Company description' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ example: '3001234567' })
  @Prop({ required: true })
  phone: string;

  @ApiProperty({ example: 'Cra 45 # 12-34', required: false })
  @Prop()
  address?: string;

  @ApiProperty({ example: 'https://mycompany.com', required: false })
  @Prop()
  website?: string;

  @ApiProperty({
    example:
      'https://res.cloudinary.com/demo/image/upload/v1713420000/mychurchcrm/companyDirectories/company-logo.png',
    required: false,
  })
  @Prop()
  logoUrl?: string;

  @ApiProperty({
    example: '["67f8e5f2df278b4b31df8a0d"]',
    required: false,
  })
  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'CompanyCategory',
    default: [],
  })
  categories: string[];

  @ApiProperty({ type: [CompanyDirectorySocialNetwork], required: false })
  @Prop({ type: [CompanyDirectorySocialNetworkSchema], default: [] })
  socialNetworks: CompanyDirectorySocialNetwork[];

  @ApiProperty({ type: [CompanyDirectoryProduct], required: false })
  @Prop({
    type: [CompanyDirectoryProductSchema],
    default: [],
    validate: [
      {
        validator: function (v: CompanyDirectoryProduct[]) {
          return v.length <= 5;
        },
        message: 'Products array cannot exceed 5 items',
      },
    ],
  })
  products: CompanyDirectoryProduct[];

  @ApiProperty({ example: '67f8e5f2df278b4b31df8a0c' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Users' })
  createdBy: string;

  @ApiProperty({ example: '67f8e5f2df278b4b31df8a0c' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Users' })
  modifiedBy: string;

  @ApiProperty({ example: true })
  @Prop({ default: true })
  isActive: boolean;
}

export type CompanyDirectoryDocument = CompanyDirectory & mongoose.Document;

export const CompanyDirectorySchema =
  SchemaFactory.createForClass(CompanyDirectory);
