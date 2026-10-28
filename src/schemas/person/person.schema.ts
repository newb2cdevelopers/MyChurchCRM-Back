import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ collection: 'persons', timestamps: true })
export class Person {
  _id: mongoose.Types.ObjectId;

  // Identification
  @Prop({ required: true, trim: true })
  documentType: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  documentNumber: string;

  @Prop({
    type: [
      {
        type: { type: String, required: true },
        number: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        reason: { type: String },
      },
    ],
    default: [],
  })
  documentHistory: {
    type: string;
    number: string;
    changedAt: Date;
    reason?: string;
  }[];

  // Name (separated for composing and searching)
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ trim: true })
  secondName?: string;

  @Prop({ required: true, trim: true })
  firstLastName: string;

  @Prop({ trim: true })
  secondLastName?: string;

  @Prop({ required: true, trim: true, index: true })
  fullName: string; // Derived and persisted (search)

  // Personal information
  @Prop({ type: Date })
  birthDate?: Date;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  mobilePhone?: string;

  @Prop({ trim: true })
  landLine?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  housingType?: string;

  @Prop({ trim: true })
  maritalStatus?: string;

  @Prop({ trim: true })
  educationalLevel?: string;

  @Prop({ trim: true })
  occupation?: string;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        AcademicInstitutionName: { type: String },
        isFinished: { type: Boolean, default: false },
        comments: { type: String },
      },
    ],
    default: [],
  })
  academicStudies?: {
    name: string;
    AcademicInstitutionName?: string;
    isFinished: boolean;
    comments?: string;
  }[];

  // Control
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Church' })
  createdByChurchId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Person', default: null })
  mergedInto?: mongoose.Types.ObjectId; // If the person was merged

  @Prop({ required: true, enum: ['active', 'merged'], default: 'active' })
  status: string;
}

export type PersonDocument = Person & mongoose.Document;

export const PersonSchema = SchemaFactory.createForClass(Person);

PersonSchema.index({ firstName: 1, firstLastName: 1 });
PersonSchema.index({ mergedInto: 1 }, { sparse: true });
