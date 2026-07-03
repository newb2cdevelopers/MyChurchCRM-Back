import { IsMongoId, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type WorkfrontAssignment = {
  Worfronts: WorkfrontDto[];
  Users: UserAssignment[];
};

export type UserAssignment = {
  Id: string;
  Name: string;
  CurrentWorkfront: string;
};

export type WorkfrontDto = {
  Id: string;
  Name: string;
};

export class WorkfrontSaveAssignmentDto {
  @IsMongoId()
  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  workfrontId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  @ApiProperty({
    example: ['679d017daf1fff94edac0c1a', '679d017daf1fff94edac0c2b'],
  })
  users: string[];
}
