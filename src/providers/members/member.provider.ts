import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Members, MemberDocument } from 'src/schemas/member/member.shema';
import { MemberGeneralInfoDto, AdditionalAcademicStudyDto, RelativeDto, MemberMinistryStudyDto, MemberWorkFrontDto } from 'src/schemas/member/Member.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';

@Injectable()
export class MemberProvider {
  constructor(
    @InjectModel(Members.name) private memberModel: Model<MemberDocument>,
  ) {}

  async getAllMembers(churchId : string = null) {
    if (churchId) {
      return this.memberModel.find({
        churchId: churchId
      })
    }

    return this.memberModel.find()
  }

  async getMemberByIdOrDocument(isSearchById : Boolean, identifier: string ): Promise< Members > {

    if(isSearchById.toString() === "true") {
      return  await this.memberModel.findOne({
        _id: identifier,
      });
    }

    return  await this.memberModel.findOne({
        documentNumber: identifier,
      });
  }

  async create(member: Members) : Promise<GeneralResponse> {

    let response: GeneralResponse = { isSuccessful: true };

    try {
      
      const existingUser  = await this.memberModel.findOne({
         documentNumber: member.documentNumber,
      });
    
    if (existingUser) {
      response.message = "El número de cédula ya está registrado"
      response.isSuccessful = false;
      return response;
    };

    if (member.relatives && member.relatives.length > 0) {
      const relativeDocuments = member.relatives.map(relative => {
        return relative.documentNumber;
      })

      const relativeMembers = await this.memberModel.find(
        {
          documentNumber: {$in: relativeDocuments}
        }
      )

      for (let index = 0; index < member.relatives.length; index++) {
        
        const relativeFound = relativeMembers.filter(relativeMember => {return relativeMember.documentNumber ===  member.relatives[index].documentNumber });

        if (relativeFound.length > 0) {
          member.relatives[index].isMember = true;
          member.relatives[index].Member = relativeFound[0]._id
        }
      }
      
    }
    
    const newMember =  await  this.memberModel.create(member);
    response.data  = newMember;

    return response;
    } catch (error) {
      console.log(error);
      response.isSuccessful = false;

      response.message = error.errmsg && error.errmsg.includes("duplicate key") ? "El usuario ya se encuentra registrado" : "Se ha presentado un error creando el miembro"

      return response;
    }
  }

  async updateGeneralMemberInfo(memberId:string, updatedMember: MemberGeneralInfoDto) : Promise<GeneralResponse> {

    let response: GeneralResponse = { isSuccessful: true };
    
    try {
      const existingMember = await this.memberModel.findOne({
        _id: memberId,
      });
      
      if (!existingMember) {
        response.isSuccessful = false;
        response.message =
            'Persona no encontrada.';
        return response
      }
  
      try {
        await this.memberModel.updateOne(
          {
            _id: memberId,
          },
          {
            $set: {
              fullName: updatedMember.fullName,
              address: updatedMember.address,
              housingType: updatedMember.housingType,
              landLine: updatedMember.landLine,
              mobilePhone: updatedMember.mobilePhone,
              birthDate: updatedMember.birthDate,
              maritalStatus: updatedMember.maritalStatus,
              educationalLevel: updatedMember.educationalLevel,
              occupation: updatedMember.occupation,
              conversionyear: updatedMember.conversionyear,
              isBaptised: updatedMember.isBaptised,
              yearInChurch: updatedMember.yearInChurch,
              documentType: updatedMember.documentType
            },
          },
        );
        
        response.data = await this.memberModel.findOne({
          _id: memberId,
        });

        return response;
  
      } catch (error) {
        console.log(error);
  
        response.isSuccessful = false;
        response.message =
            'Error actualizando la información general.';
        return response;
      }
    } catch (error) {
      response.isSuccessful = false;
      response.message =
          'Error actualizando la información general.';
      return response;
    }
  }

  async updateAdditionalAcademicStudies(memberId:string, additionalAcademicData: AdditionalAcademicStudyDto) : Promise<GeneralResponse> {

    let response: GeneralResponse = { isSuccessful: true };

    try {
      const existingMember = await this.memberModel.findOne({
        _id: memberId,
      });
      
      if (!existingMember) {
        response.isSuccessful = false;
        response.message =
            'Persona no encontrada.';
        return response
      }
  
      try {
        
        if (additionalAcademicData._id) {
          const filterStudies  = existingMember.additionalAcademicStudies.filter(study => {return study._id.toString() === additionalAcademicData._id});

          if (filterStudies.length === 0) {
            
            response.isSuccessful = false;
            response.message = "Información académica inválida"
            
            return response;
          }

          await this.memberModel.findOneAndUpdate(
            {
              _id: memberId,
              "additionalAcademicStudies._id": additionalAcademicData._id
            },
            {
              $set: {
                "additionalAcademicStudies.$.name": additionalAcademicData.name,
                "additionalAcademicStudies.$.AcademicInstitutionName": additionalAcademicData.AcademicInstitutionName,
                "additionalAcademicStudies.$.isFinished": additionalAcademicData.isFinished,
                "additionalAcademicStudies.$.comments": additionalAcademicData.comments
              }
            }
          );

        }else{
          const newStudy = {
            name: additionalAcademicData.name,
            isFinished: additionalAcademicData.isFinished,
            AcademicInstitutionName: additionalAcademicData.AcademicInstitutionName,
            comments: additionalAcademicData.comments
          };
          
          const updatedMember = await this.memberModel.updateOne(
            {
              _id: memberId,
            },
            {
              $push: { additionalAcademicStudies: newStudy },
            },
            {
              new: true,
            }
          );

        }
  
      } catch (error) {
        console.log(error);
  
        response.isSuccessful = false;
        response.message =
            'Error actualizando la información académica.';
      }

      response.data = await this.memberModel.findOne({
        _id: memberId,
      });

      return response;

    } catch (error) {
      response.isSuccessful = false;
      response.message =
          'Error actualizando la información académica.';
      return response;
    }
  }

  async updateRelativeInformation(memberId:string, relativeData: RelativeDto) : Promise<GeneralResponse> {

    let response: GeneralResponse = { isSuccessful: true };

    try {
      const existingMember = await this.memberModel.findOne({
        _id: memberId,
      });
      
      if (!existingMember) {
        response.isSuccessful = false;
        response.message =
            'Persona no encontrada.';
        return response
      }
  
      try {
        
        if (relativeData._id) {          
          const filterRelatives  = existingMember.relatives.filter(relative => {return relative._id.toString() === relativeData._id});

          if (filterRelatives.length === 0) {
            
            response.isSuccessful = false;
            response.message = "Información familiar inválida"
            
            return response;
          }

          await this.memberModel.findOneAndUpdate(
            {
              _id: memberId,
              "relatives._id": relativeData._id
            }, 
            {
              $set: {
                "relatives.$.name": relativeData.name,
                "relatives.$.address": relativeData.address,
                "relatives.$.mobilePhone": relativeData.mobilePhone,
                "relatives.$.email": relativeData.email,
                "relatives.$.birthDate": relativeData.birthDate,
                "relatives.$.educationalLevel": relativeData.educationalLevel,
                "relatives.$.occupation": relativeData.occupation,
                "relatives.$.kinship": relativeData.kinship,
                "relatives.$.comments": relativeData.comments
              }
            }
          );

        }else{
          
          let newRelative : any =  {
            name : relativeData.name,
            address : relativeData.address,
            mobilePhone : relativeData.mobilePhone,
            email: relativeData.email,
            birthDate : relativeData.birthDate,
            educationalLevel : relativeData.educationalLevel,
            occupation : relativeData.occupation,
            kinship : relativeData.kinship,
            documentNumber: relativeData.documentNumber,
            comments: relativeData.comments
          }
          const memberRelative = await this.memberModel.findOne({
            documentNumber: relativeData.documentNumber
          })
          
          if (memberRelative) {
            newRelative.isMember = true,
            newRelative.Member = memberRelative._id;
          };

          const updatedMember = await this.memberModel.updateOne(
            {
              _id: memberId,
            },
            {
              $push: { relatives: newRelative },
            },
            {
              new: true,
            }
          );

        }
  
      } catch (error) {
        console.log(error);
  
        response.isSuccessful = false;
        response.message =
            'Error actualizando la información académica.';
      }

      response.data = await this.memberModel.findOne({
        _id: memberId,
      });

      return response;

    } catch (error) {
      response.isSuccessful = false;
      response.message =
          'Error actualizando la información académica.';
      return response;
    }
  }

  async updateMinistryStudies(memberId:string, ministryStudiesData: MemberMinistryStudyDto) : Promise<GeneralResponse> {

    let response: GeneralResponse = { isSuccessful: true };

    try {
      const existingMember = await this.memberModel.findOne({
        _id: memberId,
      });
      
      if (!existingMember) {
        response.isSuccessful = false;
        response.message =
            'Persona no encontrada.';
        return response
      }
  
      try {
        
        if (ministryStudiesData._id) {
          const filterMinistryStudies  = existingMember.ministryStudies.filter(ministryStudy => {return ministryStudy._id.toString() === ministryStudiesData._id});

          if (filterMinistryStudies.length === 0) {
            
            response.isSuccessful = false;
            response.message = "Información académica inválida"
            
            return response;
          }

          await this.memberModel.findOneAndUpdate(
            {
              _id: memberId,
              "ministryStudies._id": ministryStudiesData._id
            },
            {
              $set: {
                "ministryStudies.$.name": ministryStudiesData.name,
                "ministryStudies.$.startDate": ministryStudiesData.startDate,
                "ministryStudies.$.endDate": ministryStudiesData.endDate,
                "ministryStudies.$.status": ministryStudiesData.status,
                "ministryStudies.$.comments": ministryStudiesData.comments
              }
            }
          );

        }else{
       
          const newMinistryStudy = {
            name : ministryStudiesData.name,
            startDate: ministryStudiesData.startDate,
            endDate: ministryStudiesData.endDate,
            status : ministryStudiesData.status,
            comments: ministryStudiesData.comments
          }
  
          const updatedMember = await this.memberModel.updateOne(
            {
              _id: memberId,
            },
            {
              $push: { ministryStudies: newMinistryStudy },
            },
            {
              new: true,
            }
          );

        }
  
      } catch (error) {
        console.log(error);
  
        response.isSuccessful = false;
        response.message =
            'Error actualizando la información académica.';
      }

      response.data = await this.memberModel.findOne({
        _id: memberId,
      });

      return response;

    } catch (error) {
      response.isSuccessful = false;
      response.message =
          'Error actualizando la información académica.';
      return response;
    }
  }

  async updateWorkfronts(memberId:string, workfrontData: MemberWorkFrontDto) : Promise<GeneralResponse> {

    let response: GeneralResponse = { isSuccessful: true };

    try {
      const existingMember = await this.memberModel.findOne({
        _id: memberId,
      });
      
      if (!existingMember) {
        response.isSuccessful = false;
        response.message =
            'Persona no encontrada.';
        return response
      }
  
      try {
        
        if (workfrontData._id) {
          const filterWorkfronts  = existingMember.workFronts.filter(workfront => {return workfront._id.toString() === workfrontData._id});

          if (filterWorkfronts.length === 0) {
            
            response.isSuccessful = false;
            response.message = "Información académica inválida"
            
            return response;
          }

          await this.memberModel.findOneAndUpdate(
            {
              _id: memberId,
              "workFronts._id": workfrontData._id
            },
            {
              $set: {
                "workFronts.$.name": workfrontData.name,
                "workFronts.$.startDate": workfrontData.startDate,
                "workFronts.$.endDate": workfrontData.endDate,
                "workFronts.$.role": workfrontData.role,
                "workFronts.$.status": workfrontData.status,
                "workFronts.$.comments": workfrontData.comments
              }
            }
          );

        }else{
       
          const newWorkFront = {
            name: workfrontData.name,
            startDate: workfrontData.startDate,
            endDate: workfrontData.endDate,
            role: workfrontData.role,
            status: workfrontData.status,
            comments: workfrontData.comments
          }
  

          const updatedMember = await this.memberModel.updateOne(
            {
              _id: memberId,
            },
            {
              $push: { workFronts: newWorkFront },
            },
            {
              new: true,
            }
          );

        }
  
      } catch (error) {
        console.log(error);
  
        response.isSuccessful = false;
        response.message =
            'Error actualizando la información académica.';
      }

      response.data = await this.memberModel.findOne({
        _id: memberId,
      });

      return response;

    } catch (error) {
      response.isSuccessful = false;
      response.message =
          'Error actualizando la información académica.';
      return response;
    }
  }
}
