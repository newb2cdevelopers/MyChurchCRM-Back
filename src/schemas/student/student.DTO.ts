import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { DOCUMENT_TYPES } from '../../constants/document-types';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Valentina' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Pérez' })
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(DOCUMENT_TYPES)
  @ApiProperty({ example: 'TI' })
  documentType: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '1053847291' })
  documentNumber: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '2018-03-14' })
  birthDate: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Carlos Pérez' })
  fatherName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'María Gómez' })
  motherName?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'María Gómez' })
  emergencyContactName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '3105551234' })
  emergencyContactPhone: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Abuela Luisa' })
  guardianName?: string;

  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  levelId: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({ example: 'Valentina' })
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({ example: 'Pérez' })
  lastName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(DOCUMENT_TYPES)
  @ApiPropertyOptional({ example: 'TI' })
  documentType?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({ example: '1053847291' })
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({ example: '2018-03-14' })
  birthDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Carlos Pérez' })
  fatherName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'María Gómez' })
  motherName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({ example: 'María Gómez' })
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({ example: '3105551234' })
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Abuela Luisa' })
  guardianName?: string;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ example: '679d017daf1fff94edac0c1a' })
  levelId?: string;
}
