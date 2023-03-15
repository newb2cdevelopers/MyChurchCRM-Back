import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ModuleBusiness } from 'src/business/module/module.bl';
import { Module } from 'src/schemas/module/module.schema';

@ApiTags('Modules')
@Controller('module')
export class ModuleController {
  constructor(private readonly moduleBusiness: ModuleBusiness) {}

  @Get()
  @ApiCreatedResponse({ description: 'Functionality Info' })
  async getAllModules(): Promise< Module [] > {
    return  await this.moduleBusiness.getAllModules();
  }

  @Post()
  async CreateModule(@Body() functionality: Module, @Request() req): Promise<Module> {
    return await this.moduleBusiness.CreateModule(functionality);
  }
}