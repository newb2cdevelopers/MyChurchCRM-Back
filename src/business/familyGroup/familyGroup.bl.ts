import { Injectable } from '@nestjs/common';

import { FamilyGroup } from 'src/schemas/familyGroup/familyGroup.schema';
import {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
  RegisterAttendanceDto,
  RegisterFamilyGroupMemberDto,
} from 'src/schemas/familyGroup/familyGroup.dto';
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

  async create(familyGroup: CreateFamilyGroupDto): Promise<GeneralResponse> {
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
    return this.provider.registerFamilyGroupMember(
      familyGroupId,
      familyMemberData,
    ) as unknown as Promise<GeneralResponse>;
  }
}
