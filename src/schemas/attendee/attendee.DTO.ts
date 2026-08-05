import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { DOCUMENT_TYPES } from '../../constants/document-types';

export class AttendeeDTO {
  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  documentNumber: string;

  @IsString()
  @IsIn(DOCUMENT_TYPES)
  @ApiProperty({ type: String })
  documentType: string;

  @ApiProperty({ type: String })
  phone: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: String })
  birthDate: string;

  @ApiProperty({ type: String })
  emergencyContactName: string;

  @ApiProperty({ type: String })
  emergencyContactPhone: string;

  @ApiProperty({ type: String })
  atendeeSpouse: string;
}
