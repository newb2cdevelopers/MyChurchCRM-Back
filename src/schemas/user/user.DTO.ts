import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class userEmailDTO {
  @ApiProperty({ type: String, description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class UserDTO extends userEmailDTO {
  @ApiProperty({ type: String, description: 'User first name' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ type: String, description: 'User last name' })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    type: String,
    description:
      'User password (min 8 characters, must include uppercase, lowercase, number and special character)',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)',
  })
  password: string;

  @ApiProperty({ type: String, description: 'Church ID' })
  @IsString({ message: 'Church ID must be a string' })
  @IsNotEmpty({ message: 'Church ID is required' })
  churchId: string;
}
