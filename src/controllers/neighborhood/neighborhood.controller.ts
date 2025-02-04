import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { NeighborhoodBusiness } from 'src/business/neighborhood/neighborhood.bl';
import { Neighborhood } from 'src/schemas/neighborhood/neighborhood.schema';

@ApiTags('Neighborhoods')
@Controller('neighborhood')
export class NeighborhoodController {
  constructor(private readonly neighborhoodBusiness: NeighborhoodBusiness) {}

  @Get()
  @ApiCreatedResponse({ description: 'Neighborhoods Info' })
  async getNeighborhoods(): Promise< Neighborhood [] > {
    return  await this.neighborhoodBusiness.getAllNeighborhoods();
  }

  @Post()
  async newNeighborhood(@Body() neighborhood: Neighborhood, @Request() req): Promise<Neighborhood> {
    return await this.neighborhoodBusiness.createNeighborhood(neighborhood);
  }
}
