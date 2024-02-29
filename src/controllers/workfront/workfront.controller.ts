import { Body, Controller, Get, Post, Param, UseGuards, BadRequestException, Request  } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { WorkfrontBusiness } from 'src/business/workfronts/workfront.bl';
import { Workfront } from 'src/schemas/workfronts/workfront.schema';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { Types } from 'mongoose';
import { WorkfrontSaveAssignment } from 'src/dtos/workfronts';

@ApiTags('Workfronts')
@Controller('workfront')
export class WorkfrontController {
  constructor(private readonly workfrontBusiness: WorkfrontBusiness) {}

  @Get()
  @ApiCreatedResponse({ description: 'Workfronts Info' })
  async getAllWorkfronts(): Promise< Workfront [] > {
    return  await this.workfrontBusiness.getAllWorkfronts();
  }

  @Get('workfrontsByChurch/:churchId')
  @ApiCreatedResponse({ description: 'Workfronts Info' })
  async getAllWorkfrontsByChurch(@Param('churchId') churchId: string): Promise< Workfront [] > {
    return  await this.workfrontBusiness.getAllWorkfrontsByChurch(churchId);
  }

  @UseGuards(AuthGuard)
  @Get('assignmentData/:churchId')
  @ApiCreatedResponse({ description: 'Workfront Assignment endpoint' })
  async getWorkFrontAssignmentData(@Param('churchId') churchId: string): Promise< GeneralResponse> {

    const validObjectId = Types.ObjectId.isValid(churchId);

    if (!validObjectId) {
        throw new BadRequestException('Invalid ObjectId');
    }

    return  await this.workfrontBusiness.getWorkFrontAssignmentData(churchId);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Workfronts Info' })
  async create(@Body() workfront: Workfront): Promise< Workfront > {
    return  await this.workfrontBusiness.create(workfront);
  }

  @Post("saveAssignment")
  @ApiCreatedResponse({ description: 'Workfronts Info' })
  async saveAssignment(@Request() req, @Body() assignmentSave: WorkfrontSaveAssignment ): Promise< GeneralResponse > {

    //let userWorkfrontId = req.user.workfront &&  req.user.workfront.toString();
    
    if (!Types.ObjectId.isValid(assignmentSave.workfrontId) || !assignmentSave.users || assignmentSave.users.length == 0 || assignmentSave.users.some(u => !Types.ObjectId.isValid(u)) ) {
      throw new BadRequestException('Los datos no son válidos');
    }

    return  await this.workfrontBusiness.saveAssignment(assignmentSave.workfrontId,  assignmentSave.users);
  }
}
