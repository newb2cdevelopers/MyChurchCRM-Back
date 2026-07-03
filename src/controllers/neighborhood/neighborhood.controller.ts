import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { NeighborhoodBusiness } from 'src/business/neighborhood/neighborhood.bl';
import { Neighborhood } from 'src/schemas/neighborhood/neighborhood.schema';

@ApiTags('Neighborhoods')
@Controller('neighborhood')
export class NeighborhoodController {
  constructor(private readonly neighborhoodBusiness: NeighborhoodBusiness) {}

  @Get()
  @ApiOperation({
    summary: 'Get all neighborhoods',
    description: 'Returns a list of all registered neighborhoods.',
  })
  @ApiOkResponse({
    description: 'List of neighborhoods',
    schema: {
      example: [
        {
          _id: '679d017daf1fff94edac0c1a',
          name: 'El Poblado',
          locality: {
            _id: 'abc123',
            name: 'Comuna 14',
            zone: { _id: 'def456', name: 'Zona Sur' },
          },
        },
      ],
    },
  })
  async getNeighborhoods(): Promise<Neighborhood[]> {
    return await this.neighborhoodBusiness.getAllNeighborhoods();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new neighborhood',
    description: 'Creates a new neighborhood linked to a locality.',
  })
  @ApiCreatedResponse({
    description: 'Neighborhood created successfully',
    schema: {
      example: {
        _id: '679d017daf1fff94edac0c1a',
        name: 'El Poblado',
        locality: 'abc123',
      },
    },
  })
  @ApiBody({ type: Neighborhood, description: 'Neighborhood data' })
  async newNeighborhood(
    @Body() neighborhood: Neighborhood,
  ): Promise<Neighborhood> {
    return await this.neighborhoodBusiness.createNeighborhood(neighborhood);
  }
}
