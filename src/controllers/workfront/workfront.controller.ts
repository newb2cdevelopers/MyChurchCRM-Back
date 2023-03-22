import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { WorkfrontBusiness } from 'src/business/workfronts/workfront.bl';
import { Workfront } from 'src/schemas/workfronts/workfront.schema';

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

  @Post()
  @ApiCreatedResponse({ description: 'Workfronts Info' })
  async create(@Body() workfront: Workfront): Promise< Workfront > {
    return  await this.workfrontBusiness.create(workfront);
  }
}
