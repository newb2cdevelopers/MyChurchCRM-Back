import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsIn,
  MinLength,
  Matches,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

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

  @ApiProperty({ type: String, description: 'Document type' })
  @IsString({ message: 'Document type must be a string' })
  @IsNotEmpty({ message: 'Document type is required' })
  @IsIn(['CC', 'CE', 'NIT', 'Pasaporte'], {
    message: 'Document type must be one of: CC, CE, NIT, Pasaporte',
  })
  documentType: string;

  @ApiProperty({ type: String, description: 'Document number' })
  @IsString({ message: 'Document number must be a string' })
  @IsNotEmpty({ message: 'Document number is required' })
  documentNumber: string;
}

export class UpdateUserDTO extends PartialType(UserDTO) {
  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'User active status',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ type: [String], required: false, description: 'Role IDs' })
  @IsOptional()
  @IsArray()
  roles?: string[];

  @ApiProperty({ type: String, required: false, description: 'Zone ID' })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiProperty({ type: String, required: false, description: 'Member ID' })
  @IsOptional()
  @IsString()
  memberId?: string;
}
