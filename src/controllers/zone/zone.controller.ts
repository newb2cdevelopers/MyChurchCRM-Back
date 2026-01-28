import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ZoneBusiness } from 'src/business/zone/zone.bl';
import { Zone } from 'src/schemas/zone/zone.schema';

@ApiTags('Zones')
@Controller('zone')
export class ZoneController {
  constructor(private readonly zoneBusiness: ZoneBusiness) {}

  @Get()
  @ApiCreatedResponse({ description: 'Zones Info' })
  async getZones(): Promise< Zone [] > {
    return  await this.zoneBusiness.getAllZones();
  }

  @Post()
  @ApiBody({ type: Zone, description: 'Zone Info' })
  async newZone(@Body() zone: Zone, @Request() req): Promise<Zone> {
    return await this.zoneBusiness.createZone(zone);
  }
}
