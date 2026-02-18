import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Request,
  Param,
  NotFoundException,
  InternalServerErrorException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/auth.guard';

import { FamilyGroupBusiness } from 'src/business/familyGroup/familyGroup.bl';
import {
  FamilyGroup,
  FamilyGroupAttendance,
  FamilyGroupMember,
} from 'src/schemas/familyGroup/familyGroup.schema';

import {
  ApiBody,
  ApiCreatedResponse,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { GeneralResponse } from 'src/dtos/genericResponse.dto';

@ApiTags('FamilyGroups')
@Controller('familyGroup')
export class FamiliyGroupController {
  constructor(private readonly familyGroupBusiness: FamilyGroupBusiness) {}

  @Get()
  @ApiQuery({
    name: 'churchId',
    required: false,
    description: 'Filter family groups by church ID',
  })
  @ApiCreatedResponse({ description: 'Family Group Info' })
  async getAllFamilyGroups(
    @Query() query,
    @Request() req,
  ): Promise<FamilyGroup[]> {
    return await this.familyGroupBusiness.getAllFamilyGroups(
      query && query.churchId,
    );
  }

  @Post()
  async Create(
    @Body() familyGroup: FamilyGroup,
    @Request() req,
  ): Promise<GeneralResponse> {
    return await this.familyGroupBusiness.create(familyGroup);
  }

  @Put()
  async Update(
    @Body() familyGroup: FamilyGroup,
    @Request() req,
  ): Promise<GeneralResponse> {
    return await this.familyGroupBusiness.update(familyGroup);
  }

  @Get('attendanceByGroup/:familyGroupId')
  @ApiCreatedResponse({ description: 'Family Group Attendance Info' })
  async getFamilyGroupAttendance(
    @Query() query,
    @Request() req,
    @Param('familyGroupId') familyGroupId: string,
  ): Promise<FamilyGroupAttendance[]> {
    return await this.familyGroupBusiness.getFamilyGroupAttendance(
      familyGroupId,
    );
  }

  @Post('registerFamilyGroupAttendance')
  async RegisterFamiliyGroupAttendance(
    @Body() familyGroupAttendance: FamilyGroupAttendance,
    @Request() req,
  ): Promise<GeneralResponse> {
    return await this.familyGroupBusiness.registerFamilyGroupAttendance(
      familyGroupAttendance,
    );
  }

  @Post('registerFamilyGroupMember/:familyGroupId')
  async RegisterFamiliyGroupMemeber(
    @Body() familyGroupMember: FamilyGroupMember,
    @Request() req,
    @Param('familyGroupId') familyGroupId: string,
  ): Promise<GeneralResponse> {
    return await this.familyGroupBusiness.registerFamilyGroupMember(
      familyGroupId,
      familyGroupMember,
    );
  }
}
