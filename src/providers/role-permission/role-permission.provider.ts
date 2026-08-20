import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RolePermission,
  RolePermissionDocument,
} from 'src/schemas/role-permission/role-permission.schema';
import { TtlCache } from 'src/utilities/ttl-cache';

// Role permissions change rarely (only when an admin edits roles), so the
// result of findByRoleIds is cached in memory for a short window. This avoids
// two round-trips to MongoDB Atlas on every write request and on login.
const PERMISSIONS_CACHE_TTL_MS = 60_000;

@Injectable()
export class RolePermissionProvider {
  private readonly permissionsCache = new TtlCache<RolePermissionDocument[]>(
    PERMISSIONS_CACHE_TTL_MS,
  );

  constructor(
    @InjectModel(RolePermission.name)
    private rolePermissionModel: Model<RolePermissionDocument>,
  ) {}

  async findByRoleIds(roleIds: string[]) {
    const cacheKey = roleIds.slice().sort().join('|');
    const cached = this.permissionsCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const permissions = await this.rolePermissionModel
      .find({ roleId: { $in: roleIds } })
      .populate({
        path: 'functionalityId',
        model: 'Functionality',
        populate: {
          path: 'module',
          model: 'Module',
        },
      });

    this.permissionsCache.set(cacheKey, permissions);

    return permissions;
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

    const result = await this.rolePermissionModel.bulkWrite(operations);

    // Invalidate the cache so permission changes propagate immediately.
    this.permissionsCache.clear();

    return result;
  }
}
