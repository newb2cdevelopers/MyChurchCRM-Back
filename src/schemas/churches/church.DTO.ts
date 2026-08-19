import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

// Non-military 12-hour time with mandatory hours and minutes,
// e.g. "07:00 am", "08:30 am", "12:15 pm".
const NON_MILITARY_TIME_REGEX =
  /^(0[1-9]|1[0-2]):[0-5][0-9]\s*(a\.?m\.?|p\.?m\.?)$/i;

export class ChurchServiceDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Domingo' })
  day: string;

  @IsString()
  @IsNotEmpty()
  @Matches(NON_MILITARY_TIME_REGEX, {
    message:
      'La hora debe estar en formato no militar con horas y minutos, ej. 07:00 am o 08:30 pm',
  })
  @ApiProperty({ example: '07:00 am' })
  time: string;
}

export class UpdateChurchServicesDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChurchServiceDto)
  @ArrayMaxSize(50)
  @ApiPropertyOptional({
    type: [ChurchServiceDto],
    example: [{ day: 'Domingo', time: '07:00 am' }],
    description:
      'Lista de servicios/cultos de la iglesia (día y hora no militar)',
  })
  services?: ChurchServiceDto[];
}
