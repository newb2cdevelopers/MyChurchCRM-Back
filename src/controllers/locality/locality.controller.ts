import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { LocalityBusiness } from 'src/business/locality/locality.bl';
import { Locality } from 'src/schemas/locality/locality.schema';

@ApiTags('Localitys')
@Controller('locality')
export class LocalityController {
  constructor(private readonly localityBusiness: LocalityBusiness) {}

  @Get()
  @ApiCreatedResponse({ description: 'Localitys Info' })
  async getLocalitys(): Promise< Locality [] > {
    return  await this.localityBusiness.getAllLocalitys();
  }

  @Post()
  async newLocality(@Body() locality: Locality, @Request() req): Promise<Locality> {
    return await this.localityBusiness.createLocality(locality);
  }
}
