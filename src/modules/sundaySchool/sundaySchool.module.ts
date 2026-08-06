import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Level, LevelSchema } from 'src/schemas/level/level.schema';
import { Students, StudentSchema } from 'src/schemas/student/student.schema';
import {
  SundaySchoolAttendance,
  SundaySchoolAttendanceSchema,
} from 'src/schemas/sundaySchool/attendance.schema';
import { Members, MemberSchema } from 'src/schemas/member/member.shema';
import { Users, UserSchema } from 'src/schemas/user/user.schema';

import { SundaySchoolController } from 'src/controllers/sundaySchool/sundaySchool.controller';

import { LevelBusiness } from 'src/business/sundaySchool/level.bl';
import { StudentBusiness } from 'src/business/sundaySchool/student.bl';
import { AttendanceBusiness } from 'src/business/sundaySchool/attendance.bl';

import { LevelProvider } from 'src/providers/sundaySchool/level.provider';
import { StudentProvider } from 'src/providers/sundaySchool/student.provider';
import { SundaySchoolAttendanceProvider } from 'src/providers/sundaySchool/attendance.provider';

import { RolePermissionModule } from 'src/modules/role-permission/role-permission.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Level.name, schema: LevelSchema }]),
    MongooseModule.forFeature([{ name: Students.name, schema: StudentSchema }]),
    MongooseModule.forFeature([
      {
        name: SundaySchoolAttendance.name,
        schema: SundaySchoolAttendanceSchema,
      },
    ]),
    MongooseModule.forFeature([{ name: Members.name, schema: MemberSchema }]),
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
    RolePermissionModule,
  ],
  controllers: [SundaySchoolController],
  providers: [
    LevelBusiness,
    StudentBusiness,
    AttendanceBusiness,
    LevelProvider,
    StudentProvider,
    SundaySchoolAttendanceProvider,
  ],
})
export class SundaySchoolModule {}
