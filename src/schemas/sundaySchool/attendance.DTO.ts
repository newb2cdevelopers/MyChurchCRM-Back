import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class StudentAttendanceDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  studentId: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ example: true })
  hasAttended: boolean;
}

export class RegisterAttendanceDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  levelId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '2025-08-27' })
  date: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Lección 5' })
  lessonName: string;

  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  teacherId: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  @ApiPropertyOptional({ type: [StudentAttendanceDto] })
  studentsAttendance?: StudentAttendanceDto[];

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Todos asistieron' })
  comments?: string;
}
