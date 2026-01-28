import { Injectable } from '@nestjs/common';
import { Neighborhood } from 'src/schemas/neighborhood/neighborhood.schema';
import { NeighborhoodProvider } from 'src/providers/neighborhood/neighborhood.provider'

@Injectable()
export class NeighborhoodBusiness {
  constructor(private readonly provider: NeighborhoodProvider) {}

  async getAllNeighborhoods(): Promise<Neighborhood[]> {
    return this.provider.getAllNeighborhoods() as unknown as Promise<Neighborhood[]>;
  }

  async createNeighborhood(newNeighborhood:Neighborhood): Promise<Neighborhood> {
    return this.provider.CreateNeighborhood(newNeighborhood) as unknown as Promise<Neighborhood>;
  }
}
