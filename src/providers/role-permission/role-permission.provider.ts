import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RolePermission,
  RolePermissionDocument,
} from 'src/schemas/role-permission/role-permission.schema';

@Injectable()
export class RolePermissionProvider {
  constructor(
    @InjectModel(RolePermission.name)
    private rolePermissionModel: Model<RolePermissionDocument>,
  ) {}

  async findByRoleIds(roleIds: string[]) {
    return this.rolePermissionModel
      .find({ roleId: { $in: roleIds } })
      .populate({
        path: 'functionalityId',
        model: 'Functionality',
        populate: {
          path: 'module',
          model: 'Module',
        },
      });
  }

  async upsertMany(
    entries: {
      roleId: string;
      functionalityId: string;
      scope: 'all' | 'own';
      actions: { name: string; enabled: boolean }[];
    }[],
  ) {
    const operations = entries.map((entry) => ({
      updateOne: {
        filter: {
          roleId: entry.roleId,
          functionalityId: entry.functionalityId,
        },
        update: { $set: entry },
        upsert: true,
      },
    }));

    return this.rolePermissionModel.bulkWrite(operations);
  }
}
