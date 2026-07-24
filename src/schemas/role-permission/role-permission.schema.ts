import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export class Action {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  enabled: boolean;
}

@Schema({ timestamps: true })
export class RolePermission {
  _id: number;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Role' })
  roleId: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Functionality',
  })
  functionalityId: string;

  @Prop({ required: true, enum: ['all', 'own'] })
  scope: string;

  @Prop({ type: [{ name: String, enabled: Boolean }], default: [] })
  actions: Action[];
}

export type RolePermissionDocument = RolePermission & mongoose.Document;

export const RolePermissionSchema =
  SchemaFactory.createForClass(RolePermission);

RolePermissionSchema.index({ roleId: 1, functionalityId: 1 }, { unique: true });
