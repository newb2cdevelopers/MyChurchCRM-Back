import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsMongoId,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { DOCUMENT_TYPES } from '../../constants/document-types';

export class CreateFamilyGroupDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  leader: string;

  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  neighborhood: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'CR 23 # 30 -40' })
  address: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'GFS20' })
  code: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '17:00' })
  time: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Viernes' })
  day: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '27/08/2025' })
  startDate: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Activo' })
  status?: string;

  @IsMongoId()
  @IsOptional()
  @ApiPropertyOptional({ example: '62b5eb1ab5f08f33e6de2c28' })
  created_by?: string;
}

export class UpdateFamilyGroupDto {
  @IsMongoId()
  @IsOptional()
  @ApiPropertyOptional({ example: '679d017daf1fff94edac0c1a' })
  leader?: string;

  @IsMongoId()
  @IsOptional()
  @ApiPropertyOptional({ example: '679d017daf1fff94edac0c1a' })
  neighborhood?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'CR 23 # 30 -40' })
  address?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'GFS20' })
  code?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '17:00' })
  time?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Viernes' })
  day?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '27/08/2025' })
  startDate?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Activo' })
  status?: string;
}

class MemberAttendanceDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  familyGroupmember: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ example: true })
  hasAttended: boolean;
}

export class RegisterAttendanceDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  familyGroup: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '2025-08-27' })
  date: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Lección 5' })
  lessonName: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MemberAttendanceDto)
  @ApiPropertyOptional({ type: [MemberAttendanceDto] })
  membersAttendance?: MemberAttendanceDto[];

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Todos asistieron' })
  comments?: string;
}

export class RegisterFamilyGroupMemberDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '679d017daf1fff94edac0c1a' })
  memberId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Carlos Mario' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '1236566' })
  documentNumber: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(DOCUMENT_TYPES)
  @ApiProperty({ example: 'CC' })
  documentType: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'CR 20 # 40' })
  address?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '316929417' })
  mobilePhone?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'carlos@gmail.com' })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '2020-06-22' })
  birthDate?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '2020-06-20' })
  startingDate?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Test' })
  comments?: string;
}
