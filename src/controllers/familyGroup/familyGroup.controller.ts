import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from 'src/modules/auth/auth.guard';
import { Auth } from 'src/modules/auth/auth.decorator';
import { JWTPayload } from 'src/schemas/auth/JWTPayload';
import { FamilyGroupBusiness } from 'src/business/familyGroup/familyGroup.bl';
import { FamilyGroup } from 'src/schemas/familyGroup/familyGroup.schema';
import {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
  RegisterAttendanceDto,
  RegisterFamilyGroupMemberDto,
} from 'src/schemas/familyGroup/familyGroup.dto';

import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult } from 'src/dtos/pagination.dto';

@ApiTags('FamilyGroups')
@Controller('familyGroup')
export class FamiliyGroupController {
  constructor(private readonly familyGroupBusiness: FamilyGroupBusiness) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({
    summary: 'Get all family groups',
    description:
      'Returns a paginated list of family groups. Supports filtering by church, search by code/leader/address/day, and pagination via page and limit query params.',
  })
  @ApiOkResponse({
    description: 'Paginated list of family groups',
    schema: {
      example: {
        data: [
          {
            _id: '679d017daf1fff94edac0c1a',
            code: 'GFS20',
            leader: { _id: '123', fullName: 'Carlos Mario' },
            address: 'CR 23 # 30 -40',
            day: 'Viernes',
            time: '17:00',
            status: 'Abierta',
          },
        ],
        metadata: { currentPage: 1, totalPages: 5, totalRecords: 50 },
      },
    },
  })
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

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get family group by ID',
    description:
      'Returns a single family group with deep-populated leader, neighborhood, locality and zone.',
  })
  @ApiOkResponse({
    description: 'Family group details',
    schema: {
      example: {
        _id: '679d017daf1fff94edac0c1a',
        code: 'GFS20',
        leader: { _id: '123', fullName: 'Carlos Mario' },
        neighborhood: {
          _id: '456',
          name: 'El Poblado',
          locality: {
            _id: '789',
            name: 'Comuna 14',
            zone: { _id: '012', name: 'Sur' },
          },
        },
        address: 'CR 23 # 30 -40',
        day: 'Viernes',
        time: '17:00',
        startDate: '27/08/2025',
        status: 'Abierta',
        members: [],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Family group not found' })
  @ApiParam({ name: 'id', required: true, description: 'Family group ID' })
  async getFamilyGroupById(@Param('id') id: string): Promise<FamilyGroup> {
    return await this.familyGroupBusiness.getFamilyGroupById(id);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Create a new family group',
    description:
      'Creates a new family group with leader, neighborhood, code, schedule and address.',
  })
  @ApiCreatedResponse({
    description: 'Family group created successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: {
          _id: '679d017daf1fff94edac0c1a',
          code: 'GFS20',
          leader: '679d017daf1fff94edac0c1a',
          address: 'CR 23 # 30 -40',
          day: 'Viernes',
          time: '17:00',
          startDate: '27/08/2025',
          status: 'Abierta',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error or duplicate code',
    schema: {
      example: {
        isSuccessful: false,
        message: 'El codigo de grupo familiar ya está registrado',
      },
    },
  })
  @ApiBody({ type: CreateFamilyGroupDto })
  async Create(
    @Body() familyGroup: CreateFamilyGroupDto,
    @Auth() user: JWTPayload,
  ): Promise<GeneralResponse> {
    familyGroup.created_by = user.userId;
    return await this.familyGroupBusiness.create(familyGroup);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @ApiOperation({
    summary: 'Update an existing family group',
    description:
      'Updates the fields of an existing family group identified by its ID.',
  })
  @ApiOkResponse({
    description: 'Family group updated successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: {
          _id: '679d017daf1fff94edac0c1a',
          code: 'GFS20',
          leader: { _id: '123', fullName: 'Carlos Mario' },
          address: 'CR 23 # 30 -40',
          day: 'Viernes',
          time: '17:00',
          status: 'Activo',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid family group ID or leader/neighborhood not found',
    schema: {
      example: {
        isSuccessful: false,
        message: 'El grupo familiar no es válido',
      },
    },
  })
  @ApiParam({ name: 'id', required: true, description: 'Family group ID' })
  @ApiBody({ type: UpdateFamilyGroupDto })
  async Update(
    @Param('id') id: string,
    @Body() familyGroup: UpdateFamilyGroupDto,
  ): Promise<GeneralResponse> {
    return await this.familyGroupBusiness.update(id, familyGroup);
  }

  @UseGuards(AuthGuard)
  @Get('attendanceByGroup/:familyGroupId')
  @ApiOperation({
    summary: 'Get attendance records for a family group',
    description:
      'Returns all attendance records associated with a given family group.',
  })
  @ApiOkResponse({
    description: 'Attendance records',
    schema: {
      example: [
        {
          _id: '679d017daf1fff94edac0c1a',
          date: '2025-08-27',
          lessonName: 'Lección 5',
          membersAttendance: [
            { familyGroupmember: 'abc123', hasAttended: true },
          ],
          comments: 'Todos asistieron',
          familyGroup: '679d017daf1fff94edac0c1a',
        },
      ],
    },
  })
  @ApiNotFoundResponse({ description: 'No attendance records found' })
  @ApiParam({
    name: 'familyGroupId',
    required: true,
    description: 'Family group ID',
  })
  async getFamilyGroupAttendance(
    @Param('familyGroupId') familyGroupId: string,
  ) {
    return await this.familyGroupBusiness.getFamilyGroupAttendance(
      familyGroupId,
    );
  }

  @UseGuards(AuthGuard)
  @Post('registerFamilyGroupAttendance')
  @ApiOperation({
    summary: 'Register or update attendance',
    description:
      'Creates a new attendance record or updates an existing one (matched by familyGroup + date).',
  })
  @ApiCreatedResponse({
    description: 'Attendance registered successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: {
          _id: '679d017daf1fff94edac0c1a',
          date: '2025-08-27',
          lessonName: 'Lección 5',
          membersAttendance: [
            { familyGroupmember: 'abc123', hasAttended: true },
          ],
          familyGroup: '679d017daf1fff94edac0c1a',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid family group or members do not belong to group',
    schema: {
      example: {
        isSuccessful: false,
        message: 'Los miembros seleccionados no pertenecen al grupo familiar',
      },
    },
  })
  @ApiBody({ type: RegisterAttendanceDto })
  async RegisterFamiliyGroupAttendance(
    @Body() familyGroupAttendance: RegisterAttendanceDto,
  ): Promise<GeneralResponse> {
    return await this.familyGroupBusiness.registerFamilyGroupAttendance(
      familyGroupAttendance,
    );
  }

  @UseGuards(AuthGuard)
  @Post('registerFamilyGroupMember/:familyGroupId')
  @ApiOperation({
    summary: 'Add or update a member within a family group',
    description:
      'If memberId is provided, updates the existing member subdocument. Otherwise, pushes a new member to the family group.',
  })
  @ApiCreatedResponse({
    description: 'Member registered successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: {
          _id: '679d017daf1fff94edac0c1a',
          code: 'GFS20',
          members: [
            {
              _id: 'member-abc-123',
              name: 'Carlos Mario',
              documentNumber: '1236566',
              documentType: 'CC',
            },
          ],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid family group or member data',
    schema: {
      example: {
        isSuccessful: false,
        message: 'El grupo familiar no es valido.',
      },
    },
  })
  @ApiParam({
    name: 'familyGroupId',
    required: true,
    description: 'Family group ID',
  })
  @ApiBody({ type: RegisterFamilyGroupMemberDto })
  async RegisterFamiliyGroupMemeber(
    @Body() familyGroupMember: RegisterFamilyGroupMemberDto,
    @Param('familyGroupId') familyGroupId: string,
  ): Promise<GeneralResponse> {
    return await this.familyGroupBusiness.registerFamilyGroupMember(
      familyGroupId,
      familyGroupMember,
    );
  }
}
