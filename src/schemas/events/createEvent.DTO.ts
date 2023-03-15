import { ApiProperty } from '@nestjs/swagger';


export class CreateEventDTO {

  @ApiProperty({ type: Date })
  bookingDate: string;

  @ApiProperty({ type: String })
  attendeeDocument: string;
}
