import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  ForbiddenException,
  Query,
  BadRequestException,
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
import { PermissionGuard } from 'src/modules/auth/permission.guard';
import { Permission } from 'src/modules/auth/permission.decorator';
import { Auth } from 'src/modules/auth/auth.decorator';
import { JWTPayload } from 'src/schemas/auth/JWTPayload';
import { WorkfrontBusiness } from 'src/business/workfronts/workfront.bl';
import { Workfront } from 'src/schemas/workfronts/workfront.schema';
import {
  CreateWorkfrontDto,
  UpdateWorkfrontDto,
} from 'src/schemas/workfronts/workfront.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { WorkfrontSaveAssignmentDto } from 'src/dtos/workfronts';

@ApiTags('Workfronts')
@Controller('workfront')
export class WorkfrontController {
  constructor(private readonly workfrontBusiness: WorkfrontBusiness) {}

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
          moduleId: 'asdf123',
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
          moduleId: 'defg123',
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
  @Get('by-module')
  @ApiOperation({
    summary: 'Get workfronts for the current module in the logged church',
    description:
      'Returns the valid workfronts for the active module in the logged user church. Used by the frontend to resolve the workfrontId tied to the module context, not the user.',
  })
  @ApiOkResponse({
    description: 'Workfronts for the current module',
    schema: {
      example: [
        {
          _id: '679d017daf1fff94edac0c1a',
          name: 'Escuela Dominical',
          churchId: 'abc123',
          moduleId: 'school',
        },
      ],
    },
  })
  async getWorkfrontsByCurrentModule(
    @Auth() user: JWTPayload,
    @Query('moduleId') moduleId: string,
  ): Promise<Workfront[]> {
    if (!user.churchId) {
      throw new ForbiddenException('No tienes acceso a ninguna iglesia');
    }

    if (!moduleId) {
      throw new BadRequestException('El moduleId es requerido');
    }

    return await this.workfrontBusiness.getAllWorkfrontsByChurchAndModule(
      user.churchId,
      moduleId,
    );
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
    if (!user.churchId) {
      throw new ForbiddenException('No tienes acceso a ninguna iglesia');
    }

    return await this.workfrontBusiness.getWorkFrontAssignmentData(
      user.churchId,
    );
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('settings', 'update_settings')
  @Post()
  @ApiOperation({
    summary: 'Create a new workfront',
    description:
      'Creates a new workfront (ministry front) for the logged user church. Admin only.',
  })
  @ApiCreatedResponse({
    description: 'Workfront created successfully',
    schema: {
      example: {
        _id: '679d017daf1fff94edac0c1a',
        name: 'Alabanza',
        churchId: 'abc123',
        moduleId: 'defg123',
      },
    },
  })
  @ApiBody({ type: CreateWorkfrontDto, description: 'Workfront data' })
  async create(
    @Body() workfront: CreateWorkfrontDto,
    @Auth() user: JWTPayload,
  ): Promise<Workfront> {
    if (!user.churchId) {
      throw new ForbiddenException('No tienes acceso a ninguna iglesia');
    }

    return await this.workfrontBusiness.create({
      ...workfront,
      churchId: user.churchId,
    } as Workfront);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('settings', 'update_settings')
  @Put(':id')
  @ApiOperation({
    summary: 'Update a workfront',
    description: 'Updates a workfront (ministry front). Admin only.',
  })
  @ApiOkResponse({
    description: 'Workfront updated',
    schema: {
      example: {
        isSuccessful: true,
        message: 'Frente de trabajo actualizado correctamente',
      },
    },
  })
  @ApiParam({ name: 'id', required: true, description: 'Workfront ID' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateWorkfrontDto,
  ): Promise<GeneralResponse> {
    return await this.workfrontBusiness.update(id, body);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Permission('settings', 'update_settings')
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a workfront',
    description:
      'Deletes a workfront (ministry front) and unassigns its users. Admin only.',
  })
  @ApiOkResponse({
    description: 'Workfront deleted',
    schema: {
      example: {
        isSuccessful: true,
        message: 'Frente de trabajo eliminado correctamente',
      },
    },
  })
  @ApiParam({ name: 'id', required: true, description: 'Workfront ID' })
  async remove(@Param('id') id: string): Promise<GeneralResponse> {
    return await this.workfrontBusiness.remove(id);
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
