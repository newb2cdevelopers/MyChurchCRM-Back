import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FamilyGroup,
  FamilyGroupDocument,
  FamilyGroupAttendance,
  FamilyGroupAttendanceDocument,
  FamilyGroupMember,
} from 'src/schemas/familyGroup/familyGroup.schema';
import { Members, MemberDocument } from 'src/schemas/member/member.shema';
import {
  Neighborhood,
  NeighborhoodTextDocument,
} from 'src/schemas/neighborhood/neighborhood.schema';
import { Users, UserDocument } from 'src/schemas/user/user.schema';

import { GeneralResponse } from 'src/dtos/genericResponse.dto';

@Injectable()
export class FamilyGroupProvider {
  constructor(
    @InjectModel(FamilyGroup.name)
    private familyGroupModel: Model<FamilyGroupDocument>,
    @InjectModel(Members.name) private memberModel: Model<MemberDocument>,
    @InjectModel(Neighborhood.name)
    private neighborhoodModel: Model<NeighborhoodTextDocument>,
    @InjectModel(Users.name) private userGroupModel: Model<UserDocument>,
    @InjectModel(FamilyGroupAttendance.name)
    private familyGroupAttendanceModel: Model<FamilyGroupAttendanceDocument>,
  ) {}

  async getAllFamilyGroups(churchId: string = null) {
    console.log(churchId);

    if (churchId) {
      // Find all members that belong to the specified church
      const membersInChurch = await this.memberModel
        .find({ churchId })
        .select('_id');
      const memberIds = membersInChurch.map((member) => member._id);

      console.log(memberIds);

      // Filter family groups where the leader is one of the members from that church
      return this.familyGroupModel
        .find({ leader: { $in: memberIds } })
        .populate(['leader', 'neighborhood']);
    }

    return this.familyGroupModel.find().populate(['leader', 'neighborhood']);
  }

  async getFamilyGroupAttendance(familyGroupId: string) {
    console.log(familyGroupId);

    return this.familyGroupAttendanceModel
      .find({
        familyGroup: familyGroupId,
      })
      .populate(['familyGroup']);
  }

  async create(familyGroup: FamilyGroup): Promise<GeneralResponse> {
    let response: GeneralResponse = { isSuccessful: true };

    try {
      const existinGroup = await this.familyGroupModel.findOne({
        code: familyGroup.code,
      });

      if (existinGroup) {
        response.message = 'El codigo de grupo familiar ya está registrado';
        response.isSuccessful = false;
        return response;
      }

      const existingMember = await this.memberModel.findOne({
        _id: familyGroup.leader,
      });

      if (!existingMember) {
        response.message = 'El lider encargado no es válido';
        response.isSuccessful = false;
        return response;
      }

      const existingNeighborhood = await this.neighborhoodModel.findOne({
        id: familyGroup.neighborhood,
      });

      if (!existingNeighborhood) {
        response.message = 'El barrio seleccionado no es válido';
        response.isSuccessful = false;
        return response;
      }

      const newGroup = await this.familyGroupModel.create(familyGroup);
      response.data = newGroup;

      return response;
    } catch (error) {
      console.log(error);
      response.isSuccessful = false;

      response.message = 'Se ha presentado un error creando el grupo familiar';

      return response;
    }
  }

  async update(familyGroup: FamilyGroup): Promise<GeneralResponse> {
    let response: GeneralResponse = { isSuccessful: true };

    if (!familyGroup._id) {
      response.message = 'El grupo familiar no es válido';
      response.isSuccessful = false;
      return response;
    }

    var id = familyGroup._id;

    const existingGroup = await this.familyGroupModel.findOne({
      id: id,
    });

    if (!existingGroup) {
      response.message = 'El grupo familiar no es válido';
      response.isSuccessful = false;
      return response;
    }

    const existingMember = await this.memberModel.findOne({
      _id: familyGroup.leader,
    });

    if (!existingMember) {
      response.message = 'El lider encargado no es válido';
      response.isSuccessful = false;
      return response;
    }

    const existingNeighborhood = await this.neighborhoodModel.findOne({
      id: familyGroup.neighborhood,
    });

    if (!existingNeighborhood) {
      response.message = 'El barrio seleccionado no es válido';
      response.isSuccessful = false;
      return response;
    }

    await this.familyGroupModel.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          leader: familyGroup.leader,
          neighborhood: familyGroup.neighborhood,
          address: familyGroup.address,
          time: familyGroup.time,
          day: familyGroup.day,
          startDate: familyGroup.startDate,
          status: familyGroup.status,
        },
      },
    );

    response.data = await this.familyGroupModel
      .findById(id)
      .populate(['leader', 'neighborhood']);

    return response;
  }

  async registerFamilyGroupAttendance(
    familyGroupAttendance: FamilyGroupAttendance,
  ): Promise<GeneralResponse> {
    let response: GeneralResponse = { isSuccessful: true };

    try {
      const existingGroup = await this.familyGroupModel.findOne({
        id: familyGroupAttendance.familyGroup,
      });

      if (!existingGroup) {
        response.message = 'El grupo familiar no es válido';
        response.isSuccessful = false;
        return response;
      }

      const comingMemberIds = familyGroupAttendance.membersAttendance.map(
        (member) => {
          return member.familyGroupmember;
        },
      );

      const existingMemberIds = existingGroup.members
        .map((member) => {
          return member._id;
        })
        .map((memberId) => {
          return memberId.toString();
        });

      if (
        !comingMemberIds.every((memberId) =>
          existingMemberIds.includes(memberId),
        )
      ) {
        response.message =
          'Los miembros seleccionados no pertenecen al grupo familiar';
        response.isSuccessful = false;

        return response;
      }

      const isExistingFamilyGroupAttendance =
        await this.familyGroupAttendanceModel.findOne({
          familyGroup: familyGroupAttendance.familyGroup,
          date: familyGroupAttendance.date,
        });

      if (!isExistingFamilyGroupAttendance) {
        const newAttendance = await this.familyGroupAttendanceModel.create(
          familyGroupAttendance,
        );

        response.data = newAttendance;

        return response;
      }

      const updateAttendance =
        await this.familyGroupAttendanceModel.findOneAndUpdate(
          {
            familyGroup: familyGroupAttendance.familyGroup,
            date: familyGroupAttendance.date,
          },
          familyGroupAttendance,
        );

      response.data = updateAttendance;

      return response;
    } catch (error) {
      console.log(error);
      response.isSuccessful = false;

      response.message =
        'Se ha presentado un error registrando la asistencia del grupo familiar';

      return response;
    }
  }

  async registerFamilyGroupMember(
    familyGroupId: string,
    familyMemberData: FamilyGroupMember,
  ): Promise<GeneralResponse> {
    let response: GeneralResponse = { isSuccessful: true };

    try {
      const existingFamilyGroup = await this.familyGroupModel.findOne({
        _id: familyGroupId,
      });

      if (!existingFamilyGroup) {
        response.isSuccessful = false;
        response.message = 'El grupo familiar no es valido.';
        return response;
      }

      console.log(existingFamilyGroup);
      try {
        if (familyMemberData._id) {
          const filterMember = existingFamilyGroup.members.filter((member) => {
            return member._id.toString() === familyMemberData._id.toString();
          });

          console.log(filterMember);

          if (filterMember.length === 0) {
            response.isSuccessful = false;
            response.message = 'Información del integrante no es valida';

            return response;
          }

          await this.familyGroupModel.findOneAndUpdate(
            {
              _id: familyGroupId,
              'members._id': familyMemberData._id,
            },
            {
              $set: {
                'members.$.name': familyMemberData.name,
                'members.$.documentNumber': familyMemberData.documentNumber,
                'members.$.documentType': familyMemberData.documentType,
                'members.$.address': familyMemberData.address,
                'members.$.mobilePhone': familyMemberData.mobilePhone,
                'members.$.email': familyMemberData.email,
                'members.$.birthDate': familyMemberData.birthDate,
                'members.$.comments': familyMemberData.comments,
              },
            },
          );
        } else {
          const newMember = {
            name: familyMemberData.name,
            documentNumber: familyMemberData.documentNumber,
            documentType: familyMemberData.documentType,
            address: familyMemberData.address,
            mobilePhone: familyMemberData.mobilePhone,
            email: familyMemberData.email,
            birthDate: familyMemberData.birthDate,
            comments: familyMemberData.comments,
          };

          await this.familyGroupModel.updateOne(
            {
              _id: familyGroupId,
            },
            {
              $push: { members: newMember },
            },
            {
              new: true,
            },
          );
        }
      } catch (error) {
        console.log(error);

        response.isSuccessful = false;
        response.message = 'Error actualizando la información del integrante.';

        return response;
      }

      response.data = await this.familyGroupModel
        .findById(familyGroupId)
        .populate(['leader', 'neighborhood']);

      return response;
    } catch (error) {
      console.log('error', error);

      response.isSuccessful = false;
      response.message = 'Error actualizando la información del integrante';
      return response;
    }
  }
}
