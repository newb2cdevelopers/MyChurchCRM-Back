import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { Auth } from 'src/modules/auth/auth.decorator';
import { JWTPayload } from 'src/schemas/auth/JWTPayload';
import { WorkfrontBusiness } from 'src/business/workfronts/workfront.bl';
import { Workfront } from 'src/schemas/workfronts/workfront.schema';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { WorkfrontSaveAssignmentDto } from 'src/dtos/workfronts';
import { AuthProvider } from 'src/providers/auth/auth.provider';

@ApiTags('Workfronts')
@Controller('workfront')
export class WorkfrontController {
  constructor(
    private readonly workfrontBusiness: WorkfrontBusiness,
    private readonly authProvider: AuthProvider,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all workfronts',
    description:
      'Returns a list of all registered workfronts (ministry fronts).',
  })
  @ApiOkResponse({
    description: 'List of workfronts',
    schema: {
      example: [
        {
          _id: '679d017daf1fff94edac0c1a',
          name: 'Alabanza',
          churchId: 'abc123',
        },
      ],
    },
  })
  async getAllWorkfronts(): Promise<Workfront[]> {
    return await this.workfrontBusiness.getAllWorkfronts();
  }

  @Get('workfrontsByChurch/:churchId')
  @ApiOperation({
    summary: 'Get workfronts by church',
    description: 'Returns all workfronts associated with a specific church.',
  })
  @ApiOkResponse({
    description: 'List of workfronts for the church',
    schema: {
      example: [
        {
          _id: '679d017daf1fff94edac0c1a',
          name: 'Alabanza',
          churchId: 'abc123',
        },
      ],
    },
  })
  @ApiParam({
    name: 'churchId',
    required: true,
    description: 'Church ID',
  })
  async getAllWorkfrontsByChurch(
    @Param('churchId') churchId: string,
  ): Promise<Workfront[]> {
    return await this.workfrontBusiness.getAllWorkfrontsByChurch(churchId);
  }

  @UseGuards(AuthGuard)
  @Get('assignmentData')
  @ApiOperation({
    summary: 'Get workfront assignment data',
    description:
      "Returns assignment data (members, workfronts) for the logged user's church.",
  })
  @ApiOkResponse({
    description: 'Assignment data',
    schema: {
      example: {
        isSuccessful: true,
        data: {
          workfrontList: [],
          memberList: [],
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'User does not have access to any church',
  })
  async getWorkFrontAssignmentData(
    @Auth() user: JWTPayload,
  ): Promise<GeneralResponse> {
    const fullUser = await this.authProvider.getUserById(user.userId);
    const churchId = fullUser?.churchId?.toString();

    if (!churchId) {
      throw new ForbiddenException('No tienes acceso a ninguna iglesia');
    }

    return await this.workfrontBusiness.getWorkFrontAssignmentData(churchId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new workfront',
    description: 'Creates a new workfront (ministry front).',
  })
  @ApiCreatedResponse({
    description: 'Workfront created successfully',
    schema: {
      example: {
        _id: '679d017daf1fff94edac0c1a',
        name: 'Alabanza',
        churchId: 'abc123',
      },
    },
  })
  @ApiBody({ type: Workfront, description: 'Workfront data' })
  async create(@Body() workfront: Workfront): Promise<Workfront> {
    return await this.workfrontBusiness.create(workfront);
  }

  @UseGuards(AuthGuard)
  @Post('saveAssignment')
  @ApiOperation({
    summary: 'Save workfront assignment',
    description: 'Assigns a list of users to a specific workfront.',
  })
  @ApiCreatedResponse({
    description: 'Assignment saved successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: { workfrontId: 'abc123', users: [] },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid assignment data',
    schema: {
      example: { message: 'Los datos no son válidos', statusCode: 400 },
    },
  })
  @ApiBody({ type: WorkfrontSaveAssignmentDto })
  async saveAssignment(
    @Body() assignmentSave: WorkfrontSaveAssignmentDto,
  ): Promise<GeneralResponse> {
    return await this.workfrontBusiness.saveAssignment(
      assignmentSave.workfrontId,
      assignmentSave.users,
    );
  }
}
