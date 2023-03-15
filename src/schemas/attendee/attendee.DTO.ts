import { ApiProperty } from '@nestjs/swagger';


export class AttendeeDTO {

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  documentNumber: string;

  @ApiProperty({ type: String })
  documentType: number;

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
