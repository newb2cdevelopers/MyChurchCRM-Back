import { Injectable } from '@nestjs/common';
import { Members } from 'src/schemas/member/member.shema';
import { MemberProvider } from 'src/providers/members/member.provider';
import {
  MemberGeneralInfoDto,
  AdditionalAcademicStudyDto,
  RelativeDto,
  MemberMinistryStudyDto,
  MemberWorkFrontDto,
} from 'src/schemas/member/Member.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult } from 'src/dtos/pagination.dto';

@Injectable()
export class MemberBusiness {
  constructor(private readonly provider: MemberProvider) {}

  async getAllMembers(
    churchId?: string,
    workfrontId?: string,
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Members>> {
    return this.provider.getAllMembers(
      churchId,
      workfrontId,
      search,
      page,
      limit,
    ) as unknown as Promise<PaginatedResult<Members>>;
  }

  async getMemberById(id: string): Promise<Members> {
    return await this.provider.getMemberById(id);
  }

  async create(member: MemberGeneralInfoDto): Promise<GeneralResponse> {
    return this.provider.create(member) as unknown as Promise<GeneralResponse>;
  }

  async updateGeneralMemberInfo(
    memberId: string,
    updatedMember: MemberGeneralInfoDto,
  ): Promise<GeneralResponse> {
    return this.provider.updateGeneralMemberInfo(memberId, updatedMember);
  }

  async updateAdditionalAcademicStudies(
    memberId: string,
    additionalAcademicData: AdditionalAcademicStudyDto,
  ): Promise<GeneralResponse> {
    return this.provider.updateAdditionalAcademicStudies(
      memberId,
      additionalAcademicData,
    );
  }

  async updateRelativeInformation(
    memberId: string,
    relativeData: RelativeDto,
  ): Promise<GeneralResponse> {
    return this.provider.updateRelativeInformation(memberId, relativeData);
  }

  async updateMinistryStudies(
    memberId: string,
    ministryStudiesData: MemberMinistryStudyDto,
  ): Promise<GeneralResponse> {
    return this.provider.updateMinistryStudies(memberId, ministryStudiesData);
  }

  async updateWorkfronts(
    memberId: string,
    workfrontData: MemberWorkFrontDto,
  ): Promise<GeneralResponse> {
    return this.provider.updateWorkfronts(memberId, workfrontData);
  }
}
