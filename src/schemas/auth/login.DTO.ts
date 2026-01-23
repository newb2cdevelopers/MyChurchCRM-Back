import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

/**
 * DTO for user login
 */
export class LoginDTO {
  @ApiProperty({ type: String, description: 'UserName or email' })
  @IsNotEmpty({ message: 'User is required' })
  @IsString()
  user: string;

  @ApiProperty({ type: String, description: 'Password' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  pass: string;
}

/**
 * DTO for password recovery request
 * Validates email format before sending recovery link
 */
export class recoveryEmailDTO {
  @ApiProperty({
    type: String,
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}

/**
 * DTO for password update using recovery token
 * Enforces strong password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&)
 */
export class recoveryEmailUpdateDTO {
  @ApiProperty({
    type: String,
    description:
      'New password (min 8 characters, must contain uppercase, lowercase, number and special character)',
    example: 'MyP@ssw0rd',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  newPassword: string;
}

/**
 * DTO for refreshing access token
 * Used to obtain a new access token using a valid refresh token
 */
export class RefreshTokenDTO {
  @ApiProperty({
    type: String,
    description: 'Refresh token obtained during login',
    example: 'a1b2c3d4e5f6...',
  })
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString()
  refresh_token: string;
}
