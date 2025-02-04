import { Injectable } from '@nestjs/common';
import { Locality } from 'src/schemas/locality/locality.schema';
import { LocalityProvider } from 'src/providers/locality/locality.provider'

@Injectable()
export class LocalityBusiness {
  constructor(private readonly provider: LocalityProvider) {}

  async getAllLocalitys(): Promise<Locality[]> {
    return this.provider.getAllLocalitys() as unknown as Promise<Locality[]>;
  }

  async createLocality(newLocality:Locality): Promise<Locality> {
    return this.provider.CreateLocality(newLocality) as unknown as Promise<Locality>;
  }
}
