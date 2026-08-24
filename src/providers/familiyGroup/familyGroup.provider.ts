import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import {
  FamilyGroup,
  FamilyGroupDocument,
  FamilyGroupAttendance,
  FamilyGroupAttendanceDocument,
} from 'src/schemas/familyGroup/familyGroup.schema';
import {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
  RegisterAttendanceDto,
  RegisterFamilyGroupMemberDto,
} from 'src/schemas/familyGroup/familyGroup.dto';
import { Members, MemberDocument } from 'src/schemas/member/member.shema';
import {
  Neighborhood,
  NeighborhoodTextDocument,
} from 'src/schemas/neighborhood/neighborhood.schema';
import { Users, UserDocument } from 'src/schemas/user/user.schema';
import {
  Locality,
  LocalityTextDocument,
} from 'src/schemas/locality/locality.schema';

import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult, calculatePagination } from 'src/dtos/pagination.dto';
import { TtlCache } from 'src/utilities/ttl-cache';

// Cache for getUserScopeInfo (user roles/zone/member) — changes rarely.
const USER_SCOPE_CACHE_TTL_MS = 60_000;

@Injectable()
export class FamilyGroupProvider {
  private readonly logger = new Logger(FamilyGroupProvider.name);
  private readonly userScopeCache = new TtlCache<{
    roleNames: string[];
    zoneId?: string;
    memberId?: string;
  }>(USER_SCOPE_CACHE_TTL_MS);

  constructor(
    @InjectModel(FamilyGroup.name)
    private familyGroupModel: Model<FamilyGroupDocument>,
    @InjectModel(Members.name) private memberModel: Model<MemberDocument>,
    @InjectModel(Neighborhood.name)
    private neighborhoodModel: Model<NeighborhoodTextDocument>,
    @InjectModel(Users.name) private userGroupModel: Model<UserDocument>,
    @InjectModel(Locality.name)
    private localityModel: Model<LocalityTextDocument>,
    @InjectModel(FamilyGroupAttendance.name)
    private familyGroupAttendanceModel: Model<FamilyGroupAttendanceDocument>,
  ) {}

  async getFamilyGroupById(id: string) {
    return this.familyGroupModel
      .findById(id)
      .populate([
        'leader',
        {
          path: 'neighborhood',
          populate: {
            path: 'locality',
            populate: { path: 'zone' },
          },
        },
      ])
      .lean();
  }

  async getUserScopeInfo(userId: string) {
    const cacheKey = `user-scope:${userId}`;
    const cached = this.userScopeCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const user = await this.userGroupModel
      .findById(userId)
      .populate({ path: 'roles', model: 'Role', select: 'name' })
      .select('zoneId memberId roles')
      .lean();

    const result = {
      roleNames: [] as string[],
      zoneId: undefined as string | undefined,
      memberId: undefined as string | undefined,
    };

    if (user) {
      const roles = user.roles as unknown as { name: string }[];
      result.roleNames = roles?.map((r) => r.name) || [];
      result.zoneId = user.zoneId?.toString();
      result.memberId = user.memberId?.toString();
    }

    this.userScopeCache.set(cacheKey, result);

    return result;
  }

  async getNeighborhoodIdsByZone(zoneId: string) {
    const localities = await this.localityModel
      .find({ zone: zoneId })
      .select('_id');

    const localityIds = localities.map((l) => l._id);

    const neighborhoods = await this.neighborhoodModel
      .find({ locality: { $in: localityIds } })
      .select('_id');

    return neighborhoods.map((n) => n._id);
  }

  async getAllFamilyGroups(
    churchId?: string,
    search?: string,
    page?: number,
    limit?: number,
    scopeFilter?: FilterQuery<FamilyGroupDocument>,
  ): Promise<PaginatedResult<FamilyGroup>> {
    const { skip } = calculatePagination({ page, limit });

    let filter: FilterQuery<FamilyGroupDocument> = {};
    if (churchId) {
      filter = { churchId };
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ code: regex }, { address: regex }, { day: regex }];
    }

    if (scopeFilter) {
      filter = { ...filter, ...scopeFilter };
    }

    const [data, totalRecords] = await Promise.all([
      this.familyGroupModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit || 10)
        .populate(['leader', 'neighborhood'])
        .lean(),
      this.familyGroupModel.countDocuments(filter),
    ]);

    const { page: currentPage, limit: pageSize } = calculatePagination({
      page,
      limit,
    });
    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
      data: data as unknown as FamilyGroup[],
      metadata: { currentPage, totalPages, totalRecords },
    };
  }

  async getFamilyGroupAttendance(familyGroupId: string) {
    return this.familyGroupAttendanceModel
      .find({ familyGroup: familyGroupId })
      .sort({ date: -1 })
      .lean();
  }

  async create(familyGroup: CreateFamilyGroupDto): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: true };

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
        _id: familyGroup.neighborhood,
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
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[create] Error creating family group: ${err.message}`,
        err.stack,
      );
      response.isSuccessful = false;

      response.message = 'Se ha presentado un error creando el grupo familiar';

      return response;
    }
  }

  async update(
    id: string,
    familyGroup: UpdateFamilyGroupDto,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: true };

    if (!id) {
      response.message = 'El grupo familiar no es válido';
      response.isSuccessful = false;
      return response;
    }

    const existingGroup = await this.familyGroupModel.findOne({
      _id: id,
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
      _id: familyGroup.neighborhood,
    });

    if (!existingNeighborhood) {
      response.message = 'El barrio seleccionado no es válido';
      response.isSuccessful = false;
      return response;
    }

    const setFields: Record<string, unknown> = {
      leader: familyGroup.leader,
      neighborhood: familyGroup.neighborhood,
      address: familyGroup.address,
      time: familyGroup.time,
      day: familyGroup.day,
      startDate: familyGroup.startDate,
      status: familyGroup.status,
    };

    // host is optional and may be absent on legacy groups; only set it when
    // the payload actually provides a value.
    if (familyGroup.host) {
      setFields.host = familyGroup.host;
    }

    await this.familyGroupModel.updateOne(
      {
        _id: id,
      },
      {
        $set: setFields,
      },
    );

    response.data = await this.familyGroupModel
      .findById(id)
      .populate(['leader', 'neighborhood']);

    return response;
  }

  async registerFamilyGroupAttendance(
    familyGroupAttendance: RegisterAttendanceDto,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: true };

    try {
      const existingGroup = await this.familyGroupModel.findOne({
        _id: familyGroupAttendance.familyGroup,
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
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[registerFamilyGroupAttendance] Error registering attendance: ${err.message}`,
        err.stack,
      );
      response.isSuccessful = false;

      response.message =
        'Se ha presentado un error registrando la asistencia del grupo familiar';

      return response;
    }
  }

  async registerFamilyGroupMember(
    familyGroupId: string,
    familyMemberData: RegisterFamilyGroupMemberDto,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: true };

    try {
      const existingFamilyGroup = await this.familyGroupModel.findOne({
        _id: familyGroupId,
      });

      if (!existingFamilyGroup) {
        response.isSuccessful = false;
        response.message = 'El grupo familiar no es valido.';
        return response;
      }

      try {
        if (familyMemberData.memberId) {
          const filterMember = existingFamilyGroup.members.filter((member) => {
            return (
              member._id.toString() === familyMemberData.memberId.toString()
            );
          });

          if (filterMember.length === 0) {
            response.isSuccessful = false;
            response.message = 'Información del integrante no es valida';

            return response;
          }

          await this.familyGroupModel.findOneAndUpdate(
            {
              _id: familyGroupId,
              'members._id': familyMemberData.memberId,
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
          const existingMember = await this.familyGroupModel.findOne({
            'members.documentNumber': familyMemberData.documentNumber,
            'members.documentType': familyMemberData.documentType,
          });

          if (existingMember) {
            response.isSuccessful = false;
            response.message =
              'Este miembro ya está registrado en otro grupo familiar';

            return response;
          }

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
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `[registerFamilyGroupMember] Error updating member: ${err.message}`,
          err.stack,
        );

        response.isSuccessful = false;
        response.message = 'Error actualizando la información del integrante.';

        return response;
      }

      response.data = await this.familyGroupModel
        .findById(familyGroupId)
        .populate(['leader', 'neighborhood'])
        .lean();

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[registerFamilyGroupMember] Error registering member: ${err.message}`,
        err.stack,
      );

      response.isSuccessful = false;
      response.message = 'Error actualizando la información del integrante';
      return response;
    }
  }
}
