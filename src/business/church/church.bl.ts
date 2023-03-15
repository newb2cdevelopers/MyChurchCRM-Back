import { Injectable } from '@nestjs/common';
import { Church } from 'src/schemas/churches/church.schema';
import { ChurchProvider } from 'src/providers/churches/church.provider'

@Injectable()
export class ChurchBusiness {
  constructor(private readonly provider: ChurchProvider) {}

  async getAllChurches(): Promise<Church[]> {
    return this.provider.getAllChurches() as unknown as Promise<Church[]>;
  }
}
