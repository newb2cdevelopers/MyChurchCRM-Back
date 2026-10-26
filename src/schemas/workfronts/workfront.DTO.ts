import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkfrontDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Alabanza' })
  name: string;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ example: '679d017daf1fff94edac0c1a' })
  moduleId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Activo' })
  status?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Frente de alabanza y adoración' })
  comments?: string;
}

export class UpdateWorkfrontDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({ example: 'Alabanza' })
  name?: string;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ example: '679d017daf1fff94edac0c1a' })
  moduleId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Activo' })
  status?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Frente de alabanza y adoración' })
  comments?: string;
}
