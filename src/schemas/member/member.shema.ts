import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';


@Schema()
class AdditionalAcademicStudy {
 _id: number;

  @Prop()
  name: string;
  
  @Prop()
  AcademicInstitutionName: string;

  @Prop()
  isFinished: boolean;

  @Prop()
  comments: string;
}

const AdditionalAcademicStudySchema = SchemaFactory.createForClass(AdditionalAcademicStudy);
//
@Schema()
class MemberMinistryStudy {
 _id: number;

  @Prop()
  name: string;
  
  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop()
  status: string;

  @Prop()
  comments: string;
}

const MemberMinistryStudySchema = SchemaFactory.createForClass(MemberMinistryStudy);

@Schema()
class MemberWorkFront {
 _id: number;

 @Prop()
 name: string;  

 
 @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Workfront' })
 workFrontId: string;

  @Prop()
  role: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop()
  status: string;

  @Prop()
  comments: string;
}

const MemberWorkFrontSchema = SchemaFactory.createForClass(MemberWorkFront);

@Schema()
class Relative {

 _id: number;

  @Prop()
  name: string;
  
  @Prop({ required: true })
  documentNumber: string;
  
  @Prop()
  address: string;

  @Prop()
  mobilePhone: string;

  @Prop()
  email: string;

  @Prop({ required: true })
  birthDate : Date;

  @Prop()
  educationalLevel : string;

  @Prop({ required: true })
  occupation : string;

  @Prop({ required: true })
  kinship  : string;

  @Prop({default: false})
  isMember: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null, ref: 'Members'})
  Member: string;

  @Prop()
  comments: string;
}

const RelativeSchema = SchemaFactory.createForClass(Relative);

@Schema({ timestamps: true })
export class Members {
  _id: number;

  @Prop({ unique: true })
  documentNumber: string;

    
  @Prop({ required: true })
  fullName: string;

  @Prop()
  documentType: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  housingType: string;

  @Prop()
  landLine: string;

  @Prop({ required: true })
  mobilePhone: string;

  @Prop()
  email: string;

  @Prop()
  birthDate : Date;

  @Prop()
  maritalStatus : string;

  @Prop()
  educationalLevel : string;

  @Prop({type: [AdditionalAcademicStudySchema], default: []})
  additionalAcademicStudies : [AdditionalAcademicStudy]
  
  @Prop({type: [RelativeSchema], default: []})
  relatives : [Relative]

  @Prop()
  occupation : string;

  @Prop()
  conversionyear: number;

  @Prop()
  yearInChurch: number;

  @Prop()
  isBaptised: boolean;

  @Prop({type: [MemberMinistryStudySchema] ,default: []})
  ministryStudies : [MemberMinistryStudy]

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Church' })
  churchId: string;

  @Prop({type: [MemberWorkFrontSchema], default: []})
  workFronts: [MemberWorkFront]
}

export type MemberDocument = Members & mongoose.Document;

export const MemberSchema = SchemaFactory.createForClass(Members);