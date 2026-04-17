import { ApiProperty } from '@nestjs/swagger';

export class CompanyCategoryDto {
  @ApiProperty({ example: '67f8e5f2df278b4b31df8a0d' })
  Id: string;

  @ApiProperty({ example: 'Professional Services' })
  Name: string;
}
