import { ApiProperty } from '@nestjs/swagger';

export class LoginDTO {
  @ApiProperty({ type: String, description: 'UserName or email' })
  user: string;
  @ApiProperty({ type: String, description: 'Password' })
  pass: string;
}
