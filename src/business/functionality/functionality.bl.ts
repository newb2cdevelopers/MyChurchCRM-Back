import { Injectable } from '@nestjs/common';
import { Functionality } from 'src/schemas/functionality/functionality.schema';
import { FunctionalityProvider } from 'src/providers/functionality/functionality.provider'

@Injectable()
export class FunctionalityBusiness {
  constructor(private readonly provider: FunctionalityProvider) {}

  async getAllFunctionalities(): Promise<Functionality[]> {
    return this.provider.getAllFunctionalities() as unknown as Promise<Functionality[]>;
  }

  async CreateFunctionality(newFunctionality:Functionality): Promise<Functionality> {
    return this.provider.CreateFunctionality(newFunctionality) as unknown as Promise<Functionality>;
  }
}
