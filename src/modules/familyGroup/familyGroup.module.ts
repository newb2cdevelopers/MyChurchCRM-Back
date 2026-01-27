import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { FamilyGroup, FamilyGroupSchema, FamilyGroupAttendance, FamilyGroupAttendanceSchema} from 'src/schemas/familyGroup/familyGroup.schema';

import { Members, MemberSchema } from 'src/schemas/member/member.shema';
import { Neighborhood, NeighborhoodSchema } from 'src/schemas/neighborhood/neighborhood.schema';
import { Users, UserSchema } from 'src/schemas/user/user.schema';

import { FamilyGroupBusiness } from 'src/business/familyGroup/familyGroup.bl';
import { FamilyGroupProvider } from 'src/providers/familiyGroup/familyGroup.provider';
import { FamiliyGroupController } from 'src/controllers/familyGroup/familyGroup.controller';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: FamilyGroup.name, schema: FamilyGroupSchema }]),
    MongooseModule.forFeature([{ name: FamilyGroupAttendance.name, schema: FamilyGroupAttendanceSchema }]),
    MongooseModule.forFeature([{ name: Members.name, schema: MemberSchema }]),
    MongooseModule.forFeature([{ name: Neighborhood.name, schema: NeighborhoodSchema }]),
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
  ],
  controllers: [FamiliyGroupController],
  providers: [FamilyGroupBusiness, FamilyGroupProvider],
})
export class FamilyGroupModule {}

