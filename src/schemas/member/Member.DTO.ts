import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  IsDate,
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
  @IsNotEmpty()
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
  @IsOptional()
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
  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  _id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  AcademicInstitutionName: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ type: Boolean })
  isFinished: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  comments: string;
}

export class RelativeDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  _id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true, type: String })
  documentNumber: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  address: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  mobilePhone: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  email: string;

  @IsOptional()
  @IsDate()
  @ApiProperty({ type: Date })
  birthDate: Date;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  educationalLevel: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  occupation: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  kinship: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ type: Boolean, default: false })
  isMember?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String, default: null })
  Member?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  comments: string;
}

export class MemberMinistryStudyDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  _id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  name: string;

  @IsDate()
  @IsNotEmpty()
  @ApiProperty({ type: Date })
  startDate: Date;

  @IsOptional()
  @IsDate()
  @ApiProperty({ type: Date })
  endDate: Date;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  status: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  comments: string;
}

export class MemberWorkFrontDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  _id: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  role: string;

  @IsOptional()
  @IsDate()
  @ApiProperty({ type: Date })
  startDate: Date;

  @IsOptional()
  @IsDate()
  @ApiProperty({ type: Date })
  endDate: Date;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  status: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  comments: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String, required: true })
  workFrontId;
}
