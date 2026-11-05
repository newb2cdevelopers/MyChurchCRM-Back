import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

/**
 * Membership of a person in a family group.
 *
 * Identity data (name, document, contact) lives in the canonical Person.
 * This collection only stores membership-specific data, and its _id is kept
 * equal to the legacy embedded member _id so attendance records that already
 * reference it remain valid.
 */
@Schema({ collection: 'familyGroupMemberships', timestamps: true })
export class FamilyGroupMembership {
  _id: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyGroup',
  })
  familyGroupId: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Church',
  })
  churchId: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
  })
  personId: mongoose.Types.ObjectId;

  @Prop()
  startingDate?: string;

  @Prop()
  comments?: string;

  @Prop({
    required: true,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: 'active' | 'inactive';
}

export type FamilyGroupMembershipDocument = FamilyGroupMembership &
  mongoose.Document;

export const FamilyGroupMembershipSchema = SchemaFactory.createForClass(
  FamilyGroupMembership,
);

FamilyGroupMembershipSchema.index({ familyGroupId: 1, status: 1 });
FamilyGroupMembershipSchema.index({ personId: 1 });
FamilyGroupMembershipSchema.index(
  { churchId: 1, personId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' },
    name: 'family_group_one_active_membership_per_person',
  },
);
