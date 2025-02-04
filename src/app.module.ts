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
import { CronService } from '../src/services/cron/cron.service';
import { EventProvider } from './providers/events/event.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from 'src/schemas/bookings/booking.schema';
import { Attendee, AttendeeSchema } from 'src/schemas/attendee/attendee.schema';
import { Events, EventSchema } from 'src/schemas/events/event.shema';
import { ZoneModule } from './modules/zone/zone.module';
import { LocalityModule } from './modules/locality/locality.module';
import { NeighborhoodModule } from './modules/neighborhood/neighborhood.module';

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
    ZoneModule,
    LocalityModule,
    NeighborhoodModule,
    FunctionalityModule,
    ModuleLocalModule,
    WorkfrontModule,
    MongooseModule.forFeature([{ name: Events.name, schema: EventSchema }]),
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    MongooseModule.forFeature([
      { name: Attendee.name, schema: AttendeeSchema },
    ]),
  ],
  providers: [EventProvider, CronService],
})
export class AppModule {}
