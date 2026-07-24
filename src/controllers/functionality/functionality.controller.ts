import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { FunctionalityBusiness } from 'src/business/functionality/functionality.bl';
import { Functionality } from 'src/schemas/functionality/functionality.schema';

@ApiTags('Funcionalities')
@Controller('functionality')
export class FunctionalityController {
  constructor(private readonly functionalityBusiness: FunctionalityBusiness) {}

  @Get()
  @ApiCreatedResponse({ description: 'Functionality Info' })
  async getFunctionalities(): Promise<Functionality[]> {
    return await this.functionalityBusiness.getAllFunctionalities();
  }

  @Post()
  async newFunctionality(
    @Body() functionality: Partial<Functionality>,
  ): Promise<Functionality> {
    return await this.functionalityBusiness.CreateFunctionality(functionality);
  }
}
