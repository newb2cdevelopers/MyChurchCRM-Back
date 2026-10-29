import { Injectable, ConflictException } from '@nestjs/common';
import { Members } from 'src/schemas/member/member.shema';
import { MemberProvider } from 'src/providers/members/member.provider';
import {
  MemberGeneralInfoDto,
  AdditionalAcademicStudyDto,
  RelativeDto,
  MemberMinistryStudyDto,
  MemberWorkFrontDto,
  ChangeMemberStatusDto,
} from 'src/schemas/member/Member.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult } from 'src/dtos/pagination.dto';
import { PersonProvider } from 'src/providers/person/person.provider';

@Injectable()
export class MemberBusiness {
  constructor(
    private readonly provider: MemberProvider,
    private readonly personProvider: PersonProvider,
  ) {}

  async getAllMembers(
    churchId: string,
    workfrontId?: string,
    search?: string,
    status?: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Members>> {
    if (!churchId) {
      throw new ConflictException('churchId is required');
    }

    return this.provider.getAllMembers(
      churchId,
      workfrontId,
      search,
      status,
      page,
      limit,
    ) as unknown as Promise<PaginatedResult<Members>>;
  }

  async getMemberById(id: string, churchId: string): Promise<Members | null> {
    if (!churchId) {
      throw new ConflictException('churchId is required');
    }
    return await this.provider.getMemberById(id, churchId);
  }

  async changeStatus(
    memberId: string,
    statusData: ChangeMemberStatusDto,
    churchId: string,
  ): Promise<GeneralResponse> {
    if (!churchId) {
      throw new ConflictException('churchId is required');
    }
    return this.provider.changeStatus(memberId, statusData, churchId);
  }

  async create(member: MemberGeneralInfoDto): Promise<GeneralResponse> {
    if (!member.churchId) {
      throw new ConflictException('churchId is required');
    }

    const person = await this.personProvider.resolveOrCreate({
      documentType: member.documentType,
      documentNumber: member.documentNumber,
      firstName: (member as { firstName?: string }).firstName || '',
      secondName: (member as { secondName?: string }).secondName || '',
      firstLastName: (member as { firstLastName?: string }).firstLastName || '',
      secondLastName:
        (member as { secondLastName?: string }).secondLastName || '',
      email: member.email,
      birthDate: (member as { birthDate?: string }).birthDate,
      mobilePhone: (member as { mobilePhone?: string }).mobilePhone,
      address: (member as { address?: string }).address,
      createdByChurchId: member.churchId,
    });

    return this.provider.create(member, String(person._id));
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
