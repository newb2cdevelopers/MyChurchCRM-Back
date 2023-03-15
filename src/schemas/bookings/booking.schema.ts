import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Booking {
  _id: number;

  @Prop()
  status: string;

  @Prop()
  bookingDate: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Attendee' })
  atendee: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Events' })
  eventId: string;
}

export type BookingDocument = Booking & mongoose.Document;

export const BookingSchema = SchemaFactory.createForClass(Booking);