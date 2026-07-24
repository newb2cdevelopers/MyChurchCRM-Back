import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  FamilyGroup,
  FamilyGroupSchema,
  FamilyGroupAttendance,
  FamilyGroupAttendanceSchema,
} from 'src/schemas/familyGroup/familyGroup.schema';

import { Members, MemberSchema } from 'src/schemas/member/member.shema';
import {
  Neighborhood,
  NeighborhoodSchema,
} from 'src/schemas/neighborhood/neighborhood.schema';
import { Locality, LocalitySchema } from 'src/schemas/locality/locality.schema';
import { Role, RoleSchema } from 'src/schemas/roles/role.schema';
import { Users, UserSchema } from 'src/schemas/user/user.schema';

import { FamilyGroupBusiness } from 'src/business/familyGroup/familyGroup.bl';
import { FamilyGroupProvider } from 'src/providers/familiyGroup/familyGroup.provider';
import { FamiliyGroupController } from 'src/controllers/familyGroup/familyGroup.controller';
import { RolePermissionModule } from 'src/modules/role-permission/role-permission.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FamilyGroup.name, schema: FamilyGroupSchema },
    ]),
    MongooseModule.forFeature([
      { name: FamilyGroupAttendance.name, schema: FamilyGroupAttendanceSchema },
    ]),
    MongooseModule.forFeature([{ name: Members.name, schema: MemberSchema }]),
    MongooseModule.forFeature([
      { name: Neighborhood.name, schema: NeighborhoodSchema },
    ]),
    MongooseModule.forFeature([
      { name: Locality.name, schema: LocalitySchema },
    ]),
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
    RolePermissionModule,
  ],
  controllers: [FamiliyGroupController],
  providers: [FamilyGroupBusiness, FamilyGroupProvider],
})
export class FamilyGroupModule {}
