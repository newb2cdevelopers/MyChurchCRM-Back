import { Injectable } from '@nestjs/common';

import {
  FamilyGroup,
  FamilyGroupAttendance,
  FamilyGroupMember,
} from 'src/schemas/familyGroup/familyGroup.schema';
import { FamilyGroupProvider } from 'src/providers/familiyGroup/familyGroup.provider';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult } from 'src/dtos/pagination.dto';

@Injectable()
export class FamilyGroupBusiness {
  constructor(private readonly provider: FamilyGroupProvider) {}

  async getAllFamilyGroups(
    churchId?: string,
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<FamilyGroup>> {
    return this.provider.getAllFamilyGroups(
      churchId,
      search,
      page,
      limit,
    ) as unknown as Promise<PaginatedResult<FamilyGroup>>;
  }

  async getFamilyGroupById(id: string): Promise<FamilyGroup> {
    return this.provider.getFamilyGroupById(
      id,
    ) as unknown as Promise<FamilyGroup>;
  }

  async create(familyGroup: FamilyGroup): Promise<GeneralResponse> {
    return this.provider.create(
      familyGroup,
    ) as unknown as Promise<GeneralResponse>;
  }

  async update(familyGroup: FamilyGroup): Promise<GeneralResponse> {
    return this.provider.update(
      familyGroup,
    ) as unknown as Promise<GeneralResponse>;
  }

  async getFamilyGroupAttendance(
    familyGroupId: string,
  ): Promise<FamilyGroupAttendance[]> {
    return this.provider.getFamilyGroupAttendance(
      familyGroupId,
    ) as unknown as Promise<FamilyGroupAttendance[]>;
  }

  async registerFamilyGroupAttendance(
    attendance: FamilyGroupAttendance,
  ): Promise<GeneralResponse> {
    return this.provider.registerFamilyGroupAttendance(
      attendance,
    ) as unknown as Promise<GeneralResponse>;
  }

  async registerFamilyGroupMember(
    familyGroupId: string,
    familyMemberData: FamilyGroupMember,
  ): Promise<GeneralResponse> {
    return this.provider.registerFamilyGroupMember(
      familyGroupId,
      familyMemberData,
    ) as unknown as Promise<GeneralResponse>;
  }
}
