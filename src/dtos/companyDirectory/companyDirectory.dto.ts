import { ApiProperty } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CompanyDirectorySocialNetworkDto {
  @ApiProperty({ example: 'Facebook' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  Name: string;

  @ApiProperty({ example: 'https://facebook.com/my-company' })
  @IsString({ message: 'Profile must be a string' })
  @IsNotEmpty({ message: 'Profile is required' })
  Profile: string;
}

export class CompanyDirectoryBaseRequestDto {
  @ApiProperty({ required: false, example: 'Cra 45 # 12-34' })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;

  @ApiProperty({ required: false, example: 'https://mycompany.com' })
  @IsOptional()
  @IsString({ message: 'Website must be a string' })
  website?: string;

  @ApiProperty({
    required: false,
    example: '["67f8e5f2df278b4b31df8a0d"]',
    description: 'JSON array of CompanyCategory ids',
  })
  @IsOptional()
  @IsString({ message: 'Categories must be a JSON string or string array' })
  categories?: string;

  @ApiProperty({
    required: false,
    example:
      '[{"Name":"Facebook","Profile":"https://facebook.com/my-company"}]',
    description: 'JSON array of social network objects',
  })
  @IsOptional()
  @IsString({
    message: 'Social networks must be a JSON string or string array',
  })
  socialNetworks?: string;

  @ApiProperty({ required: false, example: 'true' })
  @IsOptional()
  @IsBooleanString({ message: 'isActive must be true or false' })
  isActive?: string;
}

export class CompanyDirectoryCreateRequestDto extends CompanyDirectoryBaseRequestDto {
  @ApiProperty({ example: 'My Company' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ example: 'Company description' })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiProperty({ example: '3001234567' })
  @IsString({ message: 'Phone must be a string' })
  @IsNotEmpty({ message: 'Phone is required' })
  phone: string;
}

export class CompanyDirectoryUpdateRequestDto extends CompanyDirectoryBaseRequestDto {
  @ApiProperty({ required: false, example: 'My Company' })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @ApiProperty({ required: false, example: 'Company description' })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({ required: false, example: '3001234567' })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  phone?: string;
}

export class CompanyDirectoryResponseSocialNetworkDto {
  @ApiProperty({ example: 'Facebook' })
  Name: string;

  @ApiProperty({ example: 'https://facebook.com/my-company' })
  Profile: string;
}

export class CompanyDirectoryCategoryResponseDto {
  @ApiProperty({ example: '67f8e5f2df278b4b31df8a0d' })
  Id: string;

  @ApiProperty({ example: 'Professional Services' })
  Name: string;
}

export class CreateProductRequestDto {
  @ApiProperty({ example: 'Product title' })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({ required: false, example: 'Product description' })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}

export class CompanyDirectoryProductResponseDto {
  @ApiProperty({ example: 0 })
  Index: number;

  @ApiProperty({ example: 'Product title' })
  Title: string;

  @ApiProperty({ required: false, example: 'Product description' })
  Description?: string;

  @ApiProperty({
    example:
      'https://res.cloudinary.com/demo/image/upload/v1713420000/mychurchcrm/companyProducts/product-image.png',
  })
  ImageUrl: string;
}

export class CompanyDirectoryResponseDto {
  @ApiProperty({ example: '67f8e5f2df278b4b31df8a0d' })
  Id: string;

  @ApiProperty({ example: 'My Company' })
  Name: string;

  @ApiProperty({ example: 'Company description' })
  Description: string;

  @ApiProperty({ example: '3001234567' })
  Phone: string;

  @ApiProperty({ required: false, example: 'Cra 45 # 12-34' })
  Address?: string;

  @ApiProperty({ required: false, example: 'https://mycompany.com' })
  Website?: string;

  @ApiProperty({
    required: false,
    example:
      'https://res.cloudinary.com/demo/image/upload/v1713420000/mychurchcrm/companyDirectories/company-logo.png',
  })
  LogoUrl?: string;

  @ApiProperty({ type: [CompanyDirectoryCategoryResponseDto], required: false })
  Categories?: CompanyDirectoryCategoryResponseDto[];

  @ApiProperty({
    type: [CompanyDirectoryResponseSocialNetworkDto],
    required: false,
  })
  SocialNetworks?: CompanyDirectoryResponseSocialNetworkDto[];

  @ApiProperty({
    type: [CompanyDirectoryProductResponseDto],
    required: false,
  })
  Products?: CompanyDirectoryProductResponseDto[];

  @ApiProperty({ example: true })
  IsActive: boolean;

  @ApiProperty({ required: false, example: 12 })
  ViewsCount?: number;

  @ApiProperty({ required: false, example: '67f8e5f2df278b4b31df8a0c' })
  CreatedBy?: string;

  @ApiProperty({ required: false, example: '67f8e5f2df278b4b31df8a0c' })
  ModifiedBy?: string;

  @ApiProperty({ required: false, example: '2026-04-17T12:00:00.000Z' })
  CreatedAt?: Date;

  @ApiProperty({ required: false, example: '2026-04-17T12:00:00.000Z' })
  UpdatedAt?: Date;
}

export interface CompanyDirectorySocialNetworkInput {
  Name: string;
  Profile: string;
}

export interface CompanyDirectoryInput {
  name?: string;
  description?: string;
  phone?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
  categories?: string[];
  socialNetworks?: CompanyDirectorySocialNetworkInput[];
  createdBy?: string;
  modifiedBy?: string;
  isActive?: boolean;
}
