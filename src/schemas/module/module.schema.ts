import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Module {
  _id: number;

  @Prop({ required: true })
  name: string;

  @Prop()
  route: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  active: boolean;

  @Prop({type: [mongoose.Schema.Types.ObjectId], ref: 'Functionality' })
  Functionalities: string [] 
}

export type ModuleTextDocument = Module & mongoose.Document;

export const ModuleSchema = SchemaFactory.createForClass(Module);

ModuleSchema.index({ name: 1 }, { unique: true });