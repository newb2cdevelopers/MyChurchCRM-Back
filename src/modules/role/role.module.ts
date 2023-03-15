import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from 'src/schemas/roles/role.schema';
import { RoleController } from 'src/controllers/role/role.controller';
import { RoleBusiness } from 'src/business/roles/roles.bl';
import { RoleProvider } from 'src/providers/role/role.provider';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
  ],
  controllers: [RoleController],
  providers: [RoleBusiness, RoleProvider],
})
export class RoleModule {}
