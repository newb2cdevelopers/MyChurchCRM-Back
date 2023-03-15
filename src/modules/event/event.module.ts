import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Events, EventSchema } from 'src/schemas/events/event.shema';
import { EventController } from 'src/controllers/event/event.controller';
import { EventBusiness } from 'src/business/event/event.bl';
import { EventProvider } from 'src/providers/events/event.provider';
import { Booking, BookingSchema } from 'src/schemas/bookings/booking.schema';
import { Attendee, AttendeeSchema } from 'src/schemas/attendee/attendee.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Events.name, schema: EventSchema }]),
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    MongooseModule.forFeature([{ name: Attendee.name, schema: AttendeeSchema }]),
  ],
  controllers: [EventController],
  providers: [EventBusiness, EventProvider],
})
export class EventModule {}
