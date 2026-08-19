import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ _id: false })
export class ChurchService {
  @Prop({ required: true })
  day: string;

  @Prop({ required: true })
  time: string;
}

const ChurchServiceSchema = SchemaFactory.createForClass(ChurchService);

@Schema({ timestamps: true })
export class Church {
  _id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [ChurchServiceSchema], default: [] })
  services: ChurchService[];
}

export type ChurchTextDocument = Church & mongoose.Document;

export const ChurchSchema = SchemaFactory.createForClass(Church);

ChurchSchema.index({ name: 1 }, { unique: true });
