import { Injectable } from '@nestjs/common';
import { Module } from 'src/schemas/module/module.schema';
import { ModuleProvider } from 'src/providers/module/module.provider'

@Injectable()
export class ModuleBusiness {
  constructor(private readonly provider: ModuleProvider) {}

  async getAllModules(): Promise<Module[]> {
    return this.provider.getAllModules() as unknown as Promise<Module[]>;
  }

  async CreateModule(newModule:Module): Promise<Module> {
    return this.provider.CreateModule(newModule) as unknown as Promise<Module>;
  }
}
