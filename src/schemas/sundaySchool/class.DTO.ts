import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// levelIds travels as a JSON-encoded string because the endpoint is
// multipart/form-data (PDF upload); the Business layer parses it into an array.
export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Lección 5' })
  lessonName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '2026-08-09' })
  date: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '["679d017daf1fff94edac0c1a","679d017daf1fff94edac0c1b"]',
    description: 'JSON string with the level IDs the class is assigned to',
  })
  levelIds: string;
}

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({ example: 'Lección 5' })
  lessonName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({ example: '2026-08-09' })
  date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({
    example: '["679d017daf1fff94edac0c1a","679d017daf1fff94edac0c1b"]',
    description: 'JSON string with the level IDs the class is assigned to',
  })
  levelIds?: string;
}
