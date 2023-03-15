import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleTextDocument } from 'src/schemas/roles/role.schema';

@Injectable()
export class RoleProvider {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleTextDocument>,
  ) {}

  async getAllRoles() {
    return this.roleModel.find().populate("Functionalities")
  }

  async CreateRole(newRole : Role ) {
    return this.roleModel.create(newRole)
  }
}
