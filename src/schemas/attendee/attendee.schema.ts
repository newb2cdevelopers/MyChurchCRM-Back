import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Attendee {
  _id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  documentNumber: string;

  @Prop()
  documentType: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  birthDate: string;

  @Prop()
  emergencyContactName: string;

  @Prop()
  emergencyContactPhone: string;

  @Prop()
  atendeeSpouse: string;
}

export type AttendeeTextDocument = Attendee & mongoose.Document;

export const AttendeeSchema = SchemaFactory.createForClass(Attendee);
