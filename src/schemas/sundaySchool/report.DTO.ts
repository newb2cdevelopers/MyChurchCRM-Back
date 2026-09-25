import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AttendanceReportQueryDto {
  @IsDateString()
  @ApiProperty({
    example: '2026-08-01',
    description: 'Start date (YYYY-MM-DD)',
  })
  startDate: string;

  @IsDateString()
  @ApiProperty({ example: '2026-09-21', description: 'End date (YYYY-MM-DD)' })
  endDate: string;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ example: '679d017daf1fff94edac0c1a' })
  levelId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Domingo 07:00 am' })
  service?: string;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ example: '679d017daf1fff94edac0c1a' })
  teacherId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page (max 100)',
  })
  limit?: number;
}
