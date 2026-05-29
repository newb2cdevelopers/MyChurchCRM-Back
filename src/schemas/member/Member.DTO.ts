import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsEmail,
} from 'class-validator';

export class MemberGeneralInfoDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  documentNumber: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  fullName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  documentType: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  address: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  housingType: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  landLine: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  mobilePhone: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  birthDate: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  maritalStatus: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  educationalLevel: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  occupation: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ type: String })
  email: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number })
  conversionyear: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ type: Number })
  yearInChurch: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ type: Boolean })
  isBaptised: boolean;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  workfront: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  comments: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  churchId: string;
}

export class AdditionalAcademicStudyDto {
  @ApiProperty({ type: String })
  _id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  AcademicInstitutionName: string;

  @ApiProperty({ type: Boolean })
  isFinished: boolean;

  @ApiProperty({ type: String })
  comments: string;
}

export class RelativeDto {
  @ApiProperty({ type: String })
  _id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ required: true, type: String })
  documentNumber: string;

  @ApiProperty({ type: String })
  address: string;

  @ApiProperty({ type: String })
  mobilePhone: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: Date })
  birthDate: Date;

  @ApiProperty({ type: String })
  educationalLevel: string;

  @ApiProperty({ type: String })
  occupation: string;

  @ApiProperty({ type: String })
  kinship: string;

  @ApiProperty({ type: Boolean, default: false })
  isMember?: boolean;

  @ApiProperty({ type: String, default: null })
  Member?: string;

  @ApiProperty({ type: String })
  comments: string;
}

export class MemberMinistryStudyDto {
  @ApiProperty({ type: String })
  _id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Date })
  startDate: Date;

  @ApiProperty({ type: Date })
  endDate: Date;

  @ApiProperty({ type: String })
  status: string;

  @ApiProperty({ type: String })
  comments: string;
}

export class MemberWorkFrontDto {
  @ApiProperty({ type: String })
  _id: string;

  @ApiProperty({ type: String })
  role: string;

  @ApiProperty({ type: Date })
  startDate: Date;

  @ApiProperty({ type: Date })
  endDate: Date;

  @ApiProperty({ type: String })
  status: string;

  @ApiProperty({ type: String })
  comments: string;

  @ApiProperty({ type: String, required: true })
  workFrontId;
}
