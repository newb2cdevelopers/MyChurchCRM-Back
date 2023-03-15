import { ApiProperty } from '@nestjs/swagger';

export class GoogleResponseDTO {
  constructor() {
    this.existingUser = false;
    this.success = false;
    this.token = null;
    this.user = null;
  }

  @ApiProperty({
    type: String,
    description: 'Determines if the user exists in the app',
  })
  existingUser: boolean;
  @ApiProperty({
    type: String,
    description: 'Determines if the login in google was ok',
  })
  success: boolean;
  @ApiProperty({ type: String, description: 'New token genereted' })
  token: string;
  @ApiProperty({ type: String, description: 'Google user data' })
  user: any;
}
