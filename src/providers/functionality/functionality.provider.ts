import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Functionality, FunctionalityTextDocument } from 'src/schemas/functionality/functionality.schema';
import { Role, RoleTextDocument } from 'src/schemas/roles/role.schema';
import { Module as ModuleSystem, ModuleTextDocument } from 'src/schemas/module/module.schema';

@Injectable()
export class FunctionalityProvider {
  constructor(
    @InjectModel(Functionality.name) private functionalityModel: Model<FunctionalityTextDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleTextDocument>,
    @InjectModel(ModuleSystem.name) private moduleSystemModel: Model<ModuleTextDocument>,
  ) {}

  async getAllFunctionalities() {
    return this.functionalityModel.find().populate("role").populate("module")
  }

  async CreateFunctionality(newFunctionalityModel : Functionality ) {

    const newFunctionality = await this.functionalityModel.create(newFunctionalityModel);

    await this.roleModel.updateOne(
      {
        _id: newFunctionalityModel.role,
      },
      {
        $push: { Functionalities: newFunctionality._id },
      },
      {
        new: true,
      },
    );
    
    await this.roleModel.updateOne(
      {
        name: "Administrador",
      },
      {
        $push: { Functionalities: newFunctionality._id },
      },
      {
        new: true,
      },
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

    return newFunctionality
  }
}
