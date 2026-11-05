import { Injectable, Logger } from '@nestjs/common';

import { FamilyGroup } from 'src/schemas/familyGroup/familyGroup.schema';
import {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
  RegisterAttendanceDto,
  RegisterFamilyGroupMemberDto,
} from 'src/schemas/familyGroup/familyGroup.dto';
import { FamilyGroupProvider } from 'src/providers/familiyGroup/familyGroup.provider';
import { PersonProvider } from 'src/providers/person/person.provider';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult } from 'src/dtos/pagination.dto';

@Injectable()
export class FamilyGroupBusiness {
  private readonly logger = new Logger(FamilyGroupBusiness.name);

  constructor(
    private readonly provider: FamilyGroupProvider,
    private readonly personProvider: PersonProvider,
  ) {}

  async getAllFamilyGroups(
    churchId?: string,
    search?: string,
    page?: number,
    limit?: number,
    userId?: string,
  ): Promise<PaginatedResult<FamilyGroup>> {
    let scopeFilter;

    if (userId) {
      const { roleNames, zoneId, leaderMemberId } =
        await this.provider.getUserScopeInfo(userId);

      if (roleNames.includes('Coordinador Grupos Familiares') && zoneId) {
        const neighborhoodIds = await this.provider.getNeighborhoodIdsByZone(
          zoneId,
        );

        scopeFilter = { neighborhood: { $in: neighborhoodIds } };
      } else if (
        roleNames.includes('Líder Grupos Familiares') &&
        leaderMemberId
      ) {
        scopeFilter = { leader: leaderMemberId };
      }
    }

    return this.provider.getAllFamilyGroups(
      churchId,
      search,
      page,
      limit,
      scopeFilter,
    ) as unknown as Promise<PaginatedResult<FamilyGroup>>;
  }

  async getFamilyGroupById(id: string): Promise<FamilyGroup> {
    return this.provider.getFamilyGroupById(
      id,
    ) as unknown as Promise<FamilyGroup>;
  }

  async create(familyGroup: CreateFamilyGroupDto): Promise<GeneralResponse> {
    const churchTypes = await this.provider.getChurchFamilyGroupTypes(
      familyGroup.churchId,
    );

    if (!churchTypes) {
      return { isSuccessful: false, message: 'La iglesia no es válida' };
    }

    if (!familyGroup.type || !churchTypes.includes(familyGroup.type)) {
      return {
        isSuccessful: false,
        message: 'El tipo de grupo familiar no es válido',
      };
    }

    return this.provider.create(
      familyGroup,
    ) as unknown as Promise<GeneralResponse>;
  }

  async update(
    id: string,
    familyGroup: UpdateFamilyGroupDto,
  ): Promise<GeneralResponse> {
    return this.provider.update(
      id,
      familyGroup,
    ) as unknown as Promise<GeneralResponse>;
  }

  async getFamilyGroupAttendance(familyGroupId: string) {
    return this.provider.getFamilyGroupAttendance(familyGroupId);
  }

  async registerFamilyGroupAttendance(
    attendance: RegisterAttendanceDto,
  ): Promise<GeneralResponse> {
    return this.provider.registerFamilyGroupAttendance(
      attendance,
    ) as unknown as Promise<GeneralResponse>;
  }

  async registerFamilyGroupMember(
    familyGroupId: string,
    familyMemberData: RegisterFamilyGroupMemberDto,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    const familyGroup = await this.provider.findFamilyGroupById(familyGroupId);

    if (!familyGroup) {
      response.message = 'El grupo familiar no es valido.';
      return response;
    }

    const churchId = String(familyGroup.churchId);
    const { firstName, firstLastName } = this.splitFullName(
      familyMemberData.name,
    );

    try {
      if (familyMemberData.memberId) {
        const membership = await this.provider.findMembershipById(
          familyMemberData.memberId,
          familyGroupId,
        );

        if (!membership) {
          response.message = 'Información del integrante no es valida';
          return response;
        }
      }

      // Resolve the canonical person by document; this also handles edits
      // where the document already belongs to another person.
      const person = await this.personProvider.resolveOrCreate({
        documentType: familyMemberData.documentType,
        documentNumber: familyMemberData.documentNumber,
        firstName,
        firstLastName,
        birthDate: familyMemberData.birthDate,
        email: familyMemberData.email,
        mobilePhone: familyMemberData.mobilePhone,
        address: familyMemberData.address,
        createdByChurchId: churchId,
      });

      const duplicate = await this.provider.findActiveMembershipByPerson(
        String(person._id),
        churchId,
        familyMemberData.memberId,
      );

      if (duplicate) {
        response.message =
          'Este miembro ya está registrado en otro grupo familiar';
        return response;
      }

      await this.personProvider.updateBasicInfo(person._id, {
        firstName,
        firstLastName,
        email: familyMemberData.email,
        mobilePhone: familyMemberData.mobilePhone,
        address: familyMemberData.address,
        birthDate: familyMemberData.birthDate
          ? new Date(familyMemberData.birthDate)
          : undefined,
      });

      if (familyMemberData.memberId) {
        await this.provider.updateMembership(familyMemberData.memberId, {
          personId: String(person._id),
          startingDate: familyMemberData.startingDate,
          comments: familyMemberData.comments,
        });
      } else {
        await this.provider.createMembership({
          familyGroupId,
          churchId,
          personId: String(person._id),
          startingDate: familyMemberData.startingDate,
          comments: familyMemberData.comments,
        });
      }

      response.data = await this.provider.getFamilyGroupById(familyGroupId);
      response.isSuccessful = true;

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[registerFamilyGroupMember] Error registering member: ${err.message}`,
        err.stack,
      );

      response.message = 'Error actualizando la información del integrante';
      return response;
    }
  }

  private splitFullName(name: string): {
    firstName: string;
    firstLastName?: string;
  } {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);

    return {
      firstName: parts[0] || '',
      firstLastName: parts.slice(1).join(' ') || undefined,
    };
  }
}
