import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsMongoId,
} from 'class-validator';

export class CreateFamilyGroupDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  leader: string;

  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  neighborhood: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'CR 23 # 30 -40' })
  address: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'GFS20' })
  code: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '17:00' })
  time: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Viernes' })
  day: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '27/08/2025' })
  startDate: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Activo' })
  status?: string;
}

export class UpdateFamilyGroupDto {
  @IsMongoId()
  @IsOptional()
  @ApiPropertyOptional({ example: '679d017daf1fff94edac0c1a' })
  leader?: string;

  @IsMongoId()
  @IsOptional()
  @ApiPropertyOptional({ example: '679d017daf1fff94edac0c1a' })
  neighborhood?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'CR 23 # 30 -40' })
  address?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'GFS20' })
  code?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '17:00' })
  time?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Viernes' })
  day?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '27/08/2025' })
  startDate?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Activo' })
  status?: string;
}

class MemberAttendanceDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  familyGroupmember: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ example: true })
  hasAttended: boolean;
}

export class RegisterAttendanceDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  familyGroup: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '2025-08-27' })
  date: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Lección 5' })
  lessonName: string;

  @IsOptional()
  @ApiPropertyOptional({ type: [MemberAttendanceDto] })
  membersAttendance?: MemberAttendanceDto[];

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Todos asistieron' })
  comments?: string;
}

export class RegisterFamilyGroupMemberDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '679d017daf1fff94edac0c1a' })
  memberId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Carlos Mario' })
  name?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '1236566' })
  documentNumber: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'CC' })
  documentType: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'CR 20 # 40' })
  address?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '316929417' })
  mobilePhone?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'carlos@gmail.com' })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '2020-06-22' })
  birthDate?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '2020-06-20' })
  startingDate?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Test' })
  comments?: string;
}
