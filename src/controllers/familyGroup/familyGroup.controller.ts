import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Request,
  Param,
  Query,
} from '@nestjs/common';

import { FamilyGroupBusiness } from 'src/business/familyGroup/familyGroup.bl';
import {
  FamilyGroup,
  FamilyGroupAttendance,
  FamilyGroupMember,
} from 'src/schemas/familyGroup/familyGroup.schema';

import { ApiCreatedResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult } from 'src/dtos/pagination.dto';

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
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by code, leader name, address or day',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (max 100)',
  })
  @ApiCreatedResponse({ description: 'Family Group Info' })
  async getAllFamilyGroups(
    @Query('churchId') churchId: string,
    @Query('search') search: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ): Promise<PaginatedResult<FamilyGroup>> {
    return await this.familyGroupBusiness.getAllFamilyGroups(
      churchId,
      search,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiCreatedResponse({ description: 'Family Group By ID' })
  async getFamilyGroupById(@Param('id') id: string): Promise<FamilyGroup> {
    return await this.familyGroupBusiness.getFamilyGroupById(id);
  }

  @Post()
  async Create(@Body() familyGroup: FamilyGroup): Promise<GeneralResponse> {
    return await this.familyGroupBusiness.create(familyGroup);
  }

  @Put()
  async Update(@Body() familyGroup: FamilyGroup): Promise<GeneralResponse> {
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
