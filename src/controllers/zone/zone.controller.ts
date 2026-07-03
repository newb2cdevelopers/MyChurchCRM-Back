import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ZoneBusiness } from 'src/business/zone/zone.bl';
import { Zone } from 'src/schemas/zone/zone.schema';

@ApiTags('Zones')
@Controller('zone')
export class ZoneController {
  constructor(private readonly zoneBusiness: ZoneBusiness) {}

  @Get()
  @ApiOperation({
    summary: 'Get all zones',
    description: 'Returns a list of all registered zones.',
  })
  @ApiOkResponse({
    description: 'List of zones',
    schema: {
      example: [
        {
          _id: '679d017daf1fff94edac0c1a',
          name: 'Zona Norte',
          coordinators: [],
        },
      ],
    },
  })
  async getZones(): Promise<Zone[]> {
    return await this.zoneBusiness.getAllZones();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new zone',
    description: 'Creates a new zone with a name and optional coordinators.',
  })
  @ApiCreatedResponse({
    description: 'Zone created successfully',
    schema: {
      example: {
        _id: '679d017daf1fff94edac0c1a',
        name: 'Zona Norte',
        coordinators: [],
      },
    },
  })
  @ApiBody({ type: Zone, description: 'Zone data' })
  async newZone(@Body() zone: Zone): Promise<Zone> {
    return await this.zoneBusiness.createZone(zone);
  }
}
