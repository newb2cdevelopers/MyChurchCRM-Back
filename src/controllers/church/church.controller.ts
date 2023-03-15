import { Body, Controller, Get } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ChurchBusiness } from 'src/business/church/church.bl';
import { churchDTO } from 'src/schemas/churches/church.DTO';

@ApiTags('Church')
@Controller('church')
export class ChurchController {
  constructor(private readonly churchBusiness: ChurchBusiness) {}

  @Get()
  @ApiCreatedResponse({ description: 'Church Info' })
  async getChurches(): Promise< churchDTO [] > {
    return  await this.churchBusiness.getAllChurches();
  }
}
