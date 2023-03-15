import { Injectable } from '@nestjs/common';
import { Members } from 'src/schemas/member/member.shema';
import { MemberProvider } from 'src/providers/members/member.provider'
import { MemberGeneralInfoDto, AdditionalAcademicStudyDto, RelativeDto, MemberMinistryStudyDto, MemberWorkFrontDto } from 'src/schemas/member/Member.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';

@Injectable()
export class MemberBusiness {
  constructor(private readonly provider: MemberProvider) {}

  async getAllMembers(churchId : string = null): Promise<Members[]> {
    return this.provider.getAllMembers(churchId) as unknown as Promise<Members[]>;
  }

  async getMemberByIdOrDocument(isSearchById : Boolean, identifier: string ): Promise< Members > {
    return  await this.provider.getMemberByIdOrDocument(isSearchById, identifier);
  }

  async create(member: Members):  Promise<GeneralResponse> {
    return this.provider.create(member) as unknown as  Promise<GeneralResponse>;
  }

  async updateGeneralMemberInfo(memberId:string, updatedMember: MemberGeneralInfoDto) : Promise<GeneralResponse> {
    return this.provider.updateGeneralMemberInfo(memberId, updatedMember);
  }

  async updateAdditionalAcademicStudies(memberId:string, additionalAcademicData: AdditionalAcademicStudyDto) : Promise<GeneralResponse> {
    return this.provider.updateAdditionalAcademicStudies(memberId, additionalAcademicData);
  }

  async updateRelativeInformation(memberId:string, relativeData: RelativeDto) : Promise<GeneralResponse> {
    return this.provider.updateRelativeInformation(memberId, relativeData);
  }

  async updateMinistryStudies(memberId:string,  ministryStudiesData: MemberMinistryStudyDto) : Promise<GeneralResponse> {
    return this.provider.updateMinistryStudies(memberId, ministryStudiesData);
  }

  async updateWorkfronts(memberId:string,  workfrontData: MemberWorkFrontDto) : Promise<GeneralResponse> {
    return this.provider.updateWorkfronts(memberId, workfrontData);
  }
}
