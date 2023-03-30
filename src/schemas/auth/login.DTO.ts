import { ApiProperty } from '@nestjs/swagger';

export class LoginDTO {
  @ApiProperty({ type: String, description: 'UserName or email' })
  user: string;
  @ApiProperty({ type: String, description: 'Password' })
  pass: string;
}


export class recoveryEmailDTO {
  @ApiProperty({ type: String, description: 'email' })
  email: string;
}

export class recoveryEmailUpdateDTO {
  @ApiProperty({ type: String, description: 'newPassword' })
  newPassword: string;
}