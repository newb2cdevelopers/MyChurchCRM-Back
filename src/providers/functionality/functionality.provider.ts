import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Functionality,
  FunctionalityTextDocument,
} from 'src/schemas/functionality/functionality.schema';
import {
  Module as ModuleSystem,
  ModuleTextDocument,
} from 'src/schemas/module/module.schema';

@Injectable()
export class FunctionalityProvider {
  constructor(
    @InjectModel(Functionality.name)
    private functionalityModel: Model<FunctionalityTextDocument>,
    @InjectModel(ModuleSystem.name)
    private moduleSystemModel: Model<ModuleTextDocument>,
  ) {}

  async getAllFunctionalities() {
    return this.functionalityModel.find().populate('module');
  }

  async CreateFunctionality(newFunctionalityModel: Partial<Functionality>) {
    const newFunctionality = await this.functionalityModel.create(
      newFunctionalityModel,
    );

    await this.moduleSystemModel.updateOne(
      {
        _id: newFunctionalityModel.module,
      },
      {
        $push: { Functionalities: newFunctionality._id },
      },
      {
        new: true,
      },
    );

    return newFunctionality;
  }
}
