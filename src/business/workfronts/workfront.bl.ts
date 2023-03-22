import { Injectable } from '@nestjs/common';
import { Workfront } from 'src/schemas/workfronts/workfront.schema'
import { WorkfrontProvider } from 'src/providers/workfront/workfront.provider'

@Injectable()
export class WorkfrontBusiness {
  constructor(private readonly provider: WorkfrontProvider) {}

  async getAllWorkfronts(): Promise<Workfront[]> {
    return this.provider.getAllWorkfronts() as unknown as Promise<Workfront[]>;
  }

  async getAllWorkfrontsByChurch(churchId: string): Promise<Workfront[]> {
    return this.provider.getAllWorkfrontsByChurch(churchId) as unknown as Promise<Workfront[]>;
  }

  async create(workfront: Workfront): Promise<Workfront> {
    return this.provider.create(workfront) as unknown as Promise<Workfront>;
  }
}
