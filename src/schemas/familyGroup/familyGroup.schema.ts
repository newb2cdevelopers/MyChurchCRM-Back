import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';


class FamilyGroupMember {

  _id: number;
 
  @ApiProperty({ example: 'Carlos Mario' })
   @Prop()
   name: string;
   
   @ApiProperty({ example: '1236566' })
   @Prop({ required: true })
   documentNumber: string;
   
   @ApiProperty({ example: 'CC' })
   @Prop({ required: true })
   documentType: string;
 
   @ApiProperty({ example: 'CR 20 # 40' })
   address: string;

   @ApiProperty({ example: '316929417' })
   @Prop()
   mobilePhone: string;
 
   @ApiProperty({ example: 'carlos@gmail.com' })
   @Prop()
   email: string;
 
   @ApiProperty({ example: '22/06/2000' })
   @Prop({ required: true })
   birthDate : Date;

   @ApiProperty({ example: '20/06/2020' })
   @Prop()
   startingDate : string;
 
   @ApiProperty({ example: 'Test' })
   @Prop()
   comments: string;
 }
 
 const FamilyGroupMemberSchema = SchemaFactory.createForClass(FamilyGroupMember);

 const familyGroupExample = '[{"name": "Carlos Mario", "documentNumber": "123456", "documentType": "CC", "address": "CR 20 # 40", "mobilePhone": "316929417", "email": "carlos@gmail.com", "birthDate": "22/06/2000", "startingDate": "20/06/2020", "comments": "Test"}]'


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

  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  @Prop({ required: true , type: mongoose.Schema.Types.ObjectId, ref: 'Members' })
  leader: string;

  @ApiProperty({ example: '679d017daf1fff94edac0c1a' })
  @Prop({ required: true , type: mongoose.Schema.Types.ObjectId, ref: 'Neighborhood' })
  neighborhood: string;

  @ApiProperty({ example: 'CR 23 # 30 -40' })
  @Prop({ required: true })
  address: string;

  @ApiProperty({ example: 'GFS20' })
  @Prop({ required: true })
  code: string;

  @ApiProperty({ example: '17:00' })
  @Prop({ required: true })
  time: string;

  @ApiProperty({ example: 'Viernes' })
  @Prop({ required: true })
  day: string;

  @ApiProperty({ example: '27/08/2025' })
  @Prop({ required: true })
  startDate: string;

  @ApiProperty({ example: 'Abierta' })
  @Prop({ required: true, default: "Abierta" })
  status: string;


  @ApiProperty({ example: '62b5eb1ab5f08f33e6de2c28' })
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Users' })
  created_by: string;


  @ApiProperty({ example: familyGroupExample })



  @Prop({type: [FamilyGroupMemberSchema], default: []})
  members: [FamilyGroupMember];
}

export type FamilyGroupDocument = FamilyGroup & mongoose.Document;

export const FamilyGroupSchema = SchemaFactory.createForClass(FamilyGroup);