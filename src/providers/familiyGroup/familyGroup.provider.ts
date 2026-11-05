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
  FamilyGroupMembership,
  FamilyGroupMembershipDocument,
} from 'src/schemas/familyGroup/familyGroupMembership.schema';
import {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
  RegisterAttendanceDto,
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
import { Church, ChurchTextDocument } from 'src/schemas/churches/church.schema';

import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult, calculatePagination } from 'src/dtos/pagination.dto';
import { TtlCache } from 'src/utilities/ttl-cache';
import { withLegacyMemberFields } from 'src/utils/legacy-identity.util';

// Cache for getUserScopeInfo (user roles/zone/member) — changes rarely.
const USER_SCOPE_CACHE_TTL_MS = 60_000;

@Injectable()
export class FamilyGroupProvider {
  private readonly logger = new Logger(FamilyGroupProvider.name);
  private readonly userScopeCache = new TtlCache<{
    roleNames: string[];
    zoneId?: string;
    personId?: string;
    leaderMemberId?: string;
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
    @InjectModel(FamilyGroupMembership.name)
    private membershipModel: Model<FamilyGroupMembershipDocument>,
    @InjectModel(Church.name) private churchModel: Model<ChurchTextDocument>,
  ) {}

  async getFamilyGroupById(id: string) {
    const familyGroup = await this.familyGroupModel
      .findById(id)
      .populate([
        {
          path: 'leader',
          populate: { path: 'personId', model: 'Person' },
        },
        {
          path: 'neighborhood',
          populate: {
            path: 'locality',
            populate: { path: 'zone' },
          },
        },
      ])
      .lean();

    if (!familyGroup) {
      return null;
    }

    const memberships = await this.getMembershipsByFamilyGroup(id);

    // Keep the legacy "members" shape during the transition so existing
    // clients keep working while the data lives in familyGroupMemberships.
    return {
      ...familyGroup,
      leader: this.withLegacyLeader(familyGroup.leader),
      members: memberships.map((membership) => this.toLegacyMember(membership)),
    };
  }

  async findFamilyGroupById(id: string) {
    return this.familyGroupModel.findById(id).lean();
  }

  async getMembershipsByFamilyGroup(familyGroupId: string) {
    return this.membershipModel
      .find({ familyGroupId })
      .sort({ createdAt: 1 })
      .populate({ path: 'personId', model: 'Person' })
      .lean();
  }

  async getMembershipIdsByFamilyGroup(
    familyGroupId: string,
  ): Promise<string[]> {
    const memberships = await this.membershipModel
      .find({ familyGroupId })
      .select('_id')
      .lean();

    return memberships.map((membership) => membership._id.toString());
  }

  async findMembershipById(id: string, familyGroupId: string) {
    return this.membershipModel.findOne({ _id: id, familyGroupId }).lean();
  }

  async findActiveMembershipByPerson(
    personId: string,
    churchId: string,
    excludeId?: string,
  ) {
    const filter: FilterQuery<FamilyGroupMembershipDocument> = {
      personId,
      churchId,
      status: 'active',
    };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return this.membershipModel.findOne(filter).lean();
  }

  async createMembership(data: {
    _id?: string;
    familyGroupId: string;
    churchId: string;
    personId: string;
    startingDate?: string;
    comments?: string;
    status?: 'active' | 'inactive';
  }) {
    return this.membershipModel.create({
      ...data,
      status: data.status || 'active',
    });
  }

  async updateMembership(
    id: string,
    data: {
      personId?: string;
      startingDate?: string;
      comments?: string;
    },
  ) {
    return this.membershipModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();
  }

  private toLegacyMember(membership: {
    _id: unknown;
    personId?: unknown;
    startingDate?: string;
    comments?: string;
  }) {
    const person = membership.personId as
      | {
          fullName?: string;
          documentNumber?: string;
          documentType?: string;
          address?: string;
          mobilePhone?: string;
          email?: string;
          birthDate?: Date;
        }
      | undefined;

    return {
      _id: membership._id,
      name: person?.fullName || '',
      documentNumber: person?.documentNumber || '',
      documentType: person?.documentType || '',
      address: person?.address || '',
      mobilePhone: person?.mobilePhone || '',
      email: person?.email || '',
      birthDate: person?.birthDate,
      startingDate: membership.startingDate,
      comments: membership.comments,
    };
  }

  private withLegacyLeader(leader: unknown) {
    if (!leader || typeof leader !== 'object') return leader;

    return withLegacyMemberFields(leader as { personId?: unknown });
  }

  async getChurchFamilyGroupTypes(churchId: string): Promise<string[] | null> {
    const church = await this.churchModel
      .findById(churchId)
      .select('familyGroupTypes')
      .lean();

    return church?.familyGroupTypes || null;
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
      .select('zoneId personId roles churchId')
      .lean();

    const result = {
      roleNames: [] as string[],
      zoneId: undefined as string | undefined,
      personId: undefined as string | undefined,
      leaderMemberId: undefined as string | undefined,
    };

    if (user) {
      const roles = user.roles as unknown as { name: string }[];
      result.roleNames = roles?.map((r) => r.name) || [];
      result.zoneId = (user as { zoneId?: unknown }).zoneId?.toString();

      const personIdValue = (user as { personId?: unknown }).personId;
      const personIdStr = personIdValue ? personIdValue.toString() : undefined;
      result.personId = personIdStr;

      if (personIdStr && (user as { churchId?: unknown }).churchId) {
        const member = await this.memberModel
          .findOne({
            personId: personIdStr,
            churchId: (user as { churchId: string }).churchId,
            status: 'active',
          })
          .select('_id')
          .lean();
        result.leaderMemberId = member?._id.toString();
      }
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
        .populate([
          {
            path: 'leader',
            populate: { path: 'personId', model: 'Person' },
          },
          'neighborhood',
        ])
        .lean(),
      this.familyGroupModel.countDocuments(filter),
    ]);

    const { page: currentPage, limit: pageSize } = calculatePagination({
      page,
      limit,
    });
    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
      data: data.map((familyGroup) => ({
        ...familyGroup,
        leader: this.withLegacyLeader(familyGroup.leader),
      })) as unknown as FamilyGroup[],
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
      response.data = await this.getFamilyGroupById(String(newGroup._id));

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

    // type is optional on update (legacy groups may not have it); only set it
    // when the payload actually provides a value.
    if (familyGroup.type) {
      setFields.type = familyGroup.type;
    }

    await this.familyGroupModel.updateOne(
      {
        _id: id,
      },
      {
        $set: setFields,
      },
    );

    const updatedGroup = await this.familyGroupModel
      .findById(id)
      .populate({
        path: 'leader',
        populate: { path: 'personId', model: 'Person' },
      })
      .populate('neighborhood')
      .lean();

    response.data = updatedGroup
      ? {
          ...updatedGroup,
          leader: this.withLegacyLeader(updatedGroup.leader),
        }
      : null;

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

      const existingMemberIds = await this.getMembershipIdsByFamilyGroup(
        familyGroupAttendance.familyGroup,
      );

      if (
        !comingMemberIds.every((memberId) =>
          existingMemberIds.includes(memberId.toString()),
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
}
