import { Module } from '@nestjs/common';
import { MongoProviderModule } from './config/database/mongo/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './modules/common/common.module';
import { UserModule } from './modules/user/user.module';
import { ChurchModule } from './modules/church/church.module';
import { WorkfrontModule } from './modules/workfront/workfront.module';
import { EventModule } from './modules/event/event.module';
import { AttendeeModule } from './modules/attendee/attendee.module';
import { MemberModule } from './modules/member/member.module';
import { RoleModule } from './modules/role/role.module';
import { FunctionalityModule } from './modules/functionality/functionality.module';
import { ModuleLocalModule } from './modules/module/module.module';

@Module({
  imports: [
    MongoProviderModule,
    AuthModule,
    UserModule,
    CommonModule,
    ChurchModule,
    EventModule,
    AttendeeModule,
    MemberModule,
    RoleModule,
    FunctionalityModule,
    ModuleLocalModule,
    WorkfrontModule
  ],
})
export class AppModule {}
