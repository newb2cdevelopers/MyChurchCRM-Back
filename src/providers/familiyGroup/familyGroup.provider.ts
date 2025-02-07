import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {  FamilyGroup, FamilyGroupDocument, FamilyGroupAttendance, FamilyGroupAttendanceDocument} from 'src/schemas/familyGroup/familyGroup.schema';
import { Members, MemberDocument } from 'src/schemas/member/member.shema';
import { Neighborhood, NeighborhoodTextDocument } from 'src/schemas/neighborhood/neighborhood.schema';
import { Users, UserDocument } from 'src/schemas/user/user.schema';

import { GeneralResponse } from 'src/dtos/genericResponse.dto';

@Injectable()
export class FamilyGroupProvider {
  constructor(
    @InjectModel(FamilyGroup.name) private familyGroupModel: Model<FamilyGroupDocument>,
    @InjectModel(Members.name) private memberModel: Model<MemberDocument>,
    @InjectModel(Neighborhood.name) private neighborhoodModel: Model<NeighborhoodTextDocument>,
    @InjectModel(Users.name) private userGroupModel: Model<UserDocument>,
    @InjectModel(FamilyGroupAttendance.name) private familyGroupAttendanceModel: Model<FamilyGroupAttendanceDocument>,
  ) { }


  async getAllFamilyGroups(churchId: string = null) {

    return this.familyGroupModel.find().populate(["leader", "neighborhood"])
  }

  async getFamilyGroupAttendance(familyGroupId: string) {
    console.log(familyGroupId);
    
    return this.familyGroupAttendanceModel.find({
      familyGroup: familyGroupId
    }).populate(["familyGroup"])
  }

  async create(familyGroup: FamilyGroup): Promise<GeneralResponse> {

    let response: GeneralResponse = { isSuccessful: true };

    try {

      const existinGroup = await this.familyGroupModel.findOne({
        documentNumber: familyGroup.code,
      });

      if (existinGroup) {
        response.message = "El codigo de grupo familiar ya está registrado"
        response.isSuccessful = false;
        return response; 
      };

      const existingMember = await this.memberModel.findOne({
        _id: familyGroup.leader,
      });

      if (!existingMember) {
        response.message = "El lider encargado no es válido"
        response.isSuccessful = false;
        return response;
      };

      const existingNeighborhood = await this.neighborhoodModel.findOne({
        id: familyGroup.neighborhood,
      });

      if (!existingNeighborhood) {
        response.message = "El barrio seleccionado no es válido"
        response.isSuccessful = false;
        return response;
      };    

      const newGroup = await this.familyGroupModel.create(familyGroup);
      response.data = newGroup;

      return response;
    } catch (error) {
      console.log(error);
      response.isSuccessful = false;

      response.message = "Se ha presentado un error creando el grupo familiar"

      return response;
    }
  }

  async update(familyGroup: FamilyGroup): Promise<GeneralResponse> {
    let response: GeneralResponse = { isSuccessful: true };

    if (!familyGroup._id) {
      response.message = "El grupo familiar no es válido"
      response.isSuccessful = false;
      return response; 
    };

    const existingGroup = await this.familyGroupModel.findOne({
      id: familyGroup._id,
    });

    if (!existingGroup) {
      response.message = "El grupo familiar no es válido"
      response.isSuccessful = false;
      return response; 
    };

    const existingMember = await this.memberModel.findOne({
      _id: familyGroup.leader,
    });

    if (!existingMember) {
      response.message = "El lider encargado no es válido"
      response.isSuccessful = false;
      return response;
    };

    const existingNeighborhood = await this.neighborhoodModel.findOne({
      id: familyGroup.neighborhood,
    });

    if (!existingNeighborhood) {
      response.message = "El barrio seleccionado no es válido"
      response.isSuccessful = false;
      return response;
    }; 
    
    familyGroup.code = existingGroup.code;

    const updateGroup = await this.familyGroupModel.findOneAndUpdate({
      id: familyGroup._id,
    }, familyGroup);

    response.data = updateGroup;  

    return response;
  }

  
  async registerFamilyGroupAttendance(familyGroupAttendance: FamilyGroupAttendance): Promise<GeneralResponse> {

    let response: GeneralResponse = { isSuccessful: true };

    try {

      const existingGroup = await this.familyGroupModel.findOne({
        id: familyGroupAttendance.familyGroup,
      });

      if (!existingGroup) {
        response.message = "El grupo familiar no es válido"
        response.isSuccessful = false;
        return response; 
      };

      const comingMemberIds = familyGroupAttendance.membersAttendance.map(member => { return member.familyGroupmember });

        const existingMemberIds = existingGroup.members.map(member => { return member._id }).map(memberId => { return memberId.toString() });

      if (!comingMemberIds.every(memberId => existingMemberIds.includes(memberId))) {
        response.message = "Los miembros seleccionados no pertenecen al grupo familiar"
        response.isSuccessful = false;

        return response;
      }

      const isExistingFamilyGroupAttendance = await this.familyGroupAttendanceModel.findOne({
        familyGroup: familyGroupAttendance.familyGroup,
        date: familyGroupAttendance.date
      });

      if (!isExistingFamilyGroupAttendance) { 

        const newAttendance = await this.familyGroupAttendanceModel.create(familyGroupAttendance);

        response.data = newAttendance;

        return response;
      }

      const updateAttendance = await this.familyGroupAttendanceModel.findOneAndUpdate({
        familyGroup: familyGroupAttendance.familyGroup,
        date: familyGroupAttendance.date
      }, familyGroupAttendance);

      response.data = updateAttendance;

      return response;
    } catch (error) {
      console.log(error);
      response.isSuccessful = false;

      response.message = "Se ha presentado un error registrando la asistencia del grupo familiar"

      return response;
    }
  }

}