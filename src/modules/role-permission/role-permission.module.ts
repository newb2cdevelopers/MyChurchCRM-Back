import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RolePermission,
  RolePermissionSchema,
} from 'src/schemas/role-permission/role-permission.schema';
import { RolePermissionProvider } from 'src/providers/role-permission/role-permission.provider';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RolePermission.name, schema: RolePermissionSchema },
    ]),
  ],
  providers: [RolePermissionProvider],
  exports: [RolePermissionProvider],
})
export class RolePermissionModule {}
