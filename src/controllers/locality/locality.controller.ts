import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { LocalityBusiness } from 'src/business/locality/locality.bl';
import { Locality } from 'src/schemas/locality/locality.schema';

@ApiTags('Localities')
@Controller('locality')
export class LocalityController {
  constructor(private readonly localityBusiness: LocalityBusiness) {}

  @Get()
  @ApiOperation({
    summary: 'Get all localities',
    description: 'Returns a list of all registered localities.',
  })
  @ApiOkResponse({
    description: 'List of localities',
    schema: {
      example: [
        {
          _id: '679d017daf1fff94edac0c1a',
          name: 'Comuna 14',
          zone: { _id: 'abc123', name: 'Zona Norte' },
        },
      ],
    },
  })
  async getLocalitys(): Promise<Locality[]> {
    return await this.localityBusiness.getAllLocalitys();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new locality',
    description: 'Creates a new locality linked to a zone.',
  })
  @ApiCreatedResponse({
    description: 'Locality created successfully',
    schema: {
      example: {
        _id: '679d017daf1fff94edac0c1a',
        name: 'Comuna 14',
        zone: 'abc123',
      },
    },
  })
  @ApiBody({ type: Locality, description: 'Locality data' })
  async newLocality(@Body() locality: Locality): Promise<Locality> {
    return await this.localityBusiness.createLocality(locality);
  }
}
