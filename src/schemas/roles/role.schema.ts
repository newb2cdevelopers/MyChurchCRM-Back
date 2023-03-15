import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Role {
  _id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  active: boolean;

  @Prop({type: [mongoose.Schema.Types.ObjectId], ref: 'Functionality' })
  Functionalities: string [] 
}

export type RoleTextDocument = Role & mongoose.Document;

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ name: 1 }, { unique: true });
