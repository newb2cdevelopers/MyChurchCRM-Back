import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true })
class Workfront {

 _id: number;

  @Prop()
  name: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Church' })
  churchId: string;

  @Prop()
  status: string;
}

export type WorkfrontDocument = Workfront & mongoose.Document;

export const WorkfrontSchema = SchemaFactory.createForClass(Workfront);