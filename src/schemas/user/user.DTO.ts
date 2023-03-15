import { ApiProperty } from '@nestjs/swagger';

export class userEmailDTO {
  @ApiProperty({ type: String })
  email: string;
}

export class UserDTO extends userEmailDTO {
  @ApiProperty({ type: String })
  name: string;
  @ApiProperty({ type: String })
  lastName: string;
  @ApiProperty({ type: String })
  password: string;
  @ApiProperty({ type: String })
  churchId: string;
}
