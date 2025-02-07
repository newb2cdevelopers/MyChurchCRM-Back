import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';


class FamilyGroupMember {

  _id: number;
 
   @Prop()
   name: string;
   
   @Prop({ required: true })
   documentNumber: string;
   
   @Prop({ required: true })
   documentType: string;
 
   address: string;

   @Prop()
   mobilePhone: string;
 
   @Prop()
   email: string;
 
   @Prop({ required: true })
   birthDate : Date;
 
   @Prop()
   startingDate : string;
 
   @Prop()
   comments: string;
 }
 
 const FamilyGroupMemberSchema = SchemaFactory.createForClass(FamilyGroupMember);


 class MemberAttendace {

  _id: number;
 
  @Prop({ required: true , type: mongoose.Schema.Types.ObjectId, ref: 'FamilyGroupMember' })
   familyGroupmember: string;
   
   @Prop({ required: true })
   hasAttended: boolean;
 }
 
 const MemberAttendaceSchema = SchemaFactory.createForClass(MemberAttendace);


 export class FamilyGroupAttendance {

  _id: number;
 
 @Prop({type: [MemberAttendaceSchema], default: []})
   membersAttendance: [MemberAttendace];
   
   @Prop()
   comments: string;
   
   @Prop({ required: true })
   lessonName: string;
 
   @Prop({ required: true , type: mongoose.Schema.Types.ObjectId, ref: 'FamilyGroup' })
   familyGroup: string;
 
   @Prop({ required: true })
   date : Date;
 }
 
 export const FamilyGroupAttendanceSchema = SchemaFactory.createForClass(FamilyGroupAttendance);

 export type FamilyGroupAttendanceDocument = FamilyGroupAttendance & mongoose.Document;


@Schema({ timestamps: true })
export class FamilyGroup {
  _id: number;

  @Prop({ required: true , type: mongoose.Schema.Types.ObjectId, ref: 'Members' })
  leader: string;

  @Prop({ required: true , type: mongoose.Schema.Types.ObjectId, ref: 'Neighborhood' })
  neighborhood: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  time: string;

  @Prop({ required: true })
  day: string;

  @Prop({ required: true })
  startDate: string;

  @Prop({ required: true, default: "Abierta" })
  status: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Users' })
  created_by: string;

  @Prop({type: [FamilyGroupMemberSchema], default: []})
  members: [FamilyGroupMember];
}

export type FamilyGroupDocument = FamilyGroup & mongoose.Document;

export const FamilyGroupSchema = SchemaFactory.createForClass(FamilyGroup);