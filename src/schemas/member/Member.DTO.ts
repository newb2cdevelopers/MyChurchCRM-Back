import { ApiProperty } from '@nestjs/swagger';

export class MemberGeneralInfoDto {

    @ApiProperty({ type: String })
    fullName: string;
  // Document type
    @ApiProperty({ type: String })
    documentType: string;

    @ApiProperty({ type: String })
    address: string;
  
    @ApiProperty({ type: String })
    housingType: string;
  
    @ApiProperty({ type: String })
    landLine: String;
  
    @ApiProperty({ type: String })
    mobilePhone: string;
  
    @ApiProperty({ type: String })
    birthDate: String;
  
    @ApiProperty({ type: String })
    maritalStatus: string;
  
    @ApiProperty({ type: String })
    educationalLevel: string;

    @ApiProperty({ type: String })
    occupation: string;

    @ApiProperty({ type: Number })
    conversionyear: Number;

    @ApiProperty({ type: Number  })
    yearInChurch: number;

    @ApiProperty({ type: Boolean })
    isBaptised: Boolean;
  }

  export class AdditionalAcademicStudyDto {
    @ApiProperty({ type: String })
    _id: string;
   
     @ApiProperty({ type: String })
     name: string;
     
     @ApiProperty({ type: String })
     AcademicInstitutionName: string;

     @ApiProperty({ type: Boolean })
     isFinished: boolean;

     @ApiProperty({ type: String })
     comments: string;
   }

   export class RelativeDto {

    @ApiProperty({ type: String })
    _id: string;
   
     @ApiProperty({ type: String })
     name: string;
     
     @ApiProperty({ required: true,  type: String })
     documentNumber: string;
   
     @ApiProperty({ type: String })
     address: string;
   
     @ApiProperty({ type: String })
     mobilePhone: string;
   
     @ApiProperty({ type: String })
     email: string;
   
     @ApiProperty({ type: Date })
     birthDate : Date;
   
     @ApiProperty({ type: String })
     educationalLevel : string;
   
     @ApiProperty({ type: String })
     occupation : string;
   
     @ApiProperty({ type: String })
     kinship  : string;

     @ApiProperty({ type: Boolean, default: false })
     isMember?: boolean;
   
     @ApiProperty({ type: String, default: null })
     Member?: string;

     @ApiProperty({ type: String })
     comments: string;
   }

   export class MemberMinistryStudyDto {
    @ApiProperty({ type: String })
    _id: string;
   
    @ApiProperty({ type: String })
     name: string;
     
     @ApiProperty({ type: Date })
     startDate: Date;
   
     @ApiProperty({ type: Date })
     endDate: Date;
   
     @ApiProperty({ type: String })
     status: string;

     @ApiProperty({ type: String })
     comments: string;
   }

   export class MemberWorkFrontDto {
    @ApiProperty({ type: String })
    _id: string;
   
    @ApiProperty({ type: String })
     name: string;
     
     @ApiProperty({ type: String })
     role: string;
   
     @ApiProperty({ type: Date })
     startDate: Date;
   
     @ApiProperty({ type: Date })
     endDate: Date;
   
     @ApiProperty({ type: String })
     status: string;

     @ApiProperty({ type: String })
     comments: string;
   }