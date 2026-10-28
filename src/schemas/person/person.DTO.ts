import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEmail,
  IsIn,
} from 'class-validator';
import { DOCUMENT_TYPES } from '../../constants/document-types';

export class CreatePersonDto {
  @ApiProperty({ type: String, description: 'Document type' })
  @IsString()
  @IsNotEmpty()
  @IsIn(DOCUMENT_TYPES, {
    message: `Document type must be one of: ${DOCUMENT_TYPES.join(', ')}`,
  })
  documentType: string;

  @ApiProperty({ type: String, description: 'Document number' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({ type: String, description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ type: String, required: false, description: 'Second name' })
  @IsOptional()
  @IsString()
  secondName?: string;

  @ApiProperty({ type: String, description: 'First last name' })
  @IsString()
  @IsNotEmpty()
  firstLastName: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Second last name',
  })
  @IsOptional()
  @IsString()
  secondLastName?: string;

  @ApiProperty({ type: String, required: false, description: 'Birth date' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ type: String, required: false, description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ type: String, required: false, description: 'Mobile phone' })
  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @ApiProperty({ type: String, required: false, description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Created by church ID',
  })
  @IsOptional()
  @IsString()
  createdByChurchId?: string;
}

export class PersonIdentityDto {
  id: string;
  firstName: string;
  firstLastName: string;
  documentType: string;
  documentNumber: string;
}
