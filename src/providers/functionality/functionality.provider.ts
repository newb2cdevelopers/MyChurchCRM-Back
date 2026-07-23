import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Functionality,
  FunctionalityTextDocument,
} from 'src/schemas/functionality/functionality.schema';
import { Role, RoleTextDocument } from 'src/schemas/roles/role.schema';
import {
  Module as ModuleSystem,
  ModuleTextDocument,
} from 'src/schemas/module/module.schema';

@Injectable()
export class FunctionalityProvider {
  constructor(
    @InjectModel(Functionality.name)
    private functionalityModel: Model<FunctionalityTextDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleTextDocument>,
    @InjectModel(ModuleSystem.name)
    private moduleSystemModel: Model<ModuleTextDocument>,
  ) {}

  async getAllFunctionalities() {
    return this.functionalityModel.find().populate('module');
  }

  async CreateFunctionality(
    newFunctionalityModel: Partial<Functionality>,
    roleIds?: string[],
  ) {
    const newFunctionality = await this.functionalityModel.create(
      newFunctionalityModel,
    );

    const targetRoleIds = new Set(roleIds || []);
    const adminRole = await this.roleModel.findOne({
      name: 'Administrador',
    });
    if (adminRole) {
      targetRoleIds.add(adminRole._id.toString());
    }

    for (const roleId of targetRoleIds) {
      await this.roleModel.updateOne(
        { _id: roleId },
        { $push: { Functionalities: newFunctionality._id } },
      );
    }

    await this.moduleSystemModel.updateOne(
      { _id: newFunctionalityModel.module },
      { $push: { Functionalities: newFunctionality._id } },
    );

    return newFunctionality;
  }
}
