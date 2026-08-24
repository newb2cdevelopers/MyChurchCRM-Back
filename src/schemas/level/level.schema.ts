import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Level {
  _id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  minAge: number;

  @Prop({ required: true })
  maxAge: number;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Members', default: [] })
  teachers: string[];

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Church' })
  churchId: string;
}

export type LevelDocument = Level & mongoose.Document;

export const LevelSchema = SchemaFactory.createForClass(Level);

LevelSchema.index({ name: 1, churchId: 1 }, { unique: true });
LevelSchema.index({ churchId: 1, createdAt: -1 });
LevelSchema.index({ teachers: 1 });
