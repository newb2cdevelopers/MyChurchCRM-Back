import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLevelDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Párvulos' })
  name: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 3 })
  minAge: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 5 })
  maxAge: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayMaxSize(4)
  @ApiPropertyOptional({
    type: [String],
    example: ['679d017daf1fff94edac0c1a'],
    description: 'IDs de los maestros (Members) asignados al nivel (máx. 4)',
  })
  teachers?: string[];
}

export class UpdateLevelDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({ example: 'Párvulos' })
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 3 })
  minAge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 5 })
  maxAge?: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayMaxSize(4)
  @ApiPropertyOptional({
    type: [String],
    description: 'IDs de los maestros (Members) asignados al nivel (máx. 4)',
  })
  teachers?: string[];
}
