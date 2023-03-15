import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Module, ModuleTextDocument } from 'src/schemas/module/module.schema';

@Injectable()
export class ModuleProvider {
  constructor(
    @InjectModel(Module.name) private moduleModel: Model<ModuleTextDocument>,
  ) {}

  async getAllModules() {
    return this.moduleModel.find().populate("Functionalities");
  }

  async CreateModule(newModuleModel : Module ) {
    return this.moduleModel.create(newModuleModel)
  }
}
