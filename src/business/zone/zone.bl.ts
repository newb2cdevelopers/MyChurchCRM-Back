import { Injectable } from '@nestjs/common';
import { Zone } from 'src/schemas/zone/zone.schema';
import { ZoneProvider } from 'src/providers/zone/zone.provider'

@Injectable()
export class ZoneBusiness {
  constructor(private readonly provider: ZoneProvider) {}

  async getAllZones(): Promise<Zone[]> {
    return this.provider.getAllZones() as unknown as Promise<Zone[]>;
  }

  async createZone(newZone:Zone): Promise<Zone> {
    return this.provider.CreateZone(newZone) as unknown as Promise<Zone>;
  }
}
