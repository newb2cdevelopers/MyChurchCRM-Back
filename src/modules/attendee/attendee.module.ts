import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Attendee, AttendeeSchema } from 'src/schemas/attendee/attendee.schema';
import { AttendeeBusiness } from 'src/business/attendee/attendee.bl';
import { AttendeeController } from 'src/controllers/attendee/attendee.controller';
import { AttendeeProvider } from 'src/providers/attendee/attendee.provider';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Attendee.name, schema: AttendeeSchema }]),
  ],
  controllers: [AttendeeController],
  providers: [AttendeeProvider, AttendeeBusiness],
})
export class AttendeeModule {}
