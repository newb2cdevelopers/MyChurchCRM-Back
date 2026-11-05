import { Injectable, ConflictException } from '@nestjs/common';
import { Members } from 'src/schemas/member/member.shema';
import { MemberProvider } from 'src/providers/members/member.provider';
import {
  MemberGeneralInfoDto,
  AdditionalAcademicStudyDto,
  RelativeDto,
  MemberMinistryStudyDto,
  ChangeMemberStatusDto,
} from 'src/schemas/member/Member.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult } from 'src/dtos/pagination.dto';
import { PersonProvider } from 'src/providers/person/person.provider';
import { splitFullName } from 'src/utils/legacy-identity.util';

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

    const { firstName, firstLastName } = splitFullName(member.fullName);

    const person = await this.personProvider.resolveOrCreate({
      documentType: member.documentType,
      documentNumber: member.documentNumber,
      firstName,
      firstLastName,
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
    const existingMember = await this.provider.getMemberById(memberId);

    if (!existingMember) {
      return {
        isSuccessful: false,
        message: 'Persona no encontrada.',
      };
    }

    const personId = this.extractId(existingMember.personId);
    const churchId = String(existingMember.churchId);

    if (personId) {
      const { firstName, firstLastName } = splitFullName(
        updatedMember.fullName,
      );

      let person = await this.personProvider.findById(personId);

      if (
        person &&
        updatedMember.documentNumber &&
        updatedMember.documentNumber !== person.documentNumber
      ) {
        const resolvedPerson = await this.personProvider.resolveOrCreate({
          documentType: updatedMember.documentType,
          documentNumber: updatedMember.documentNumber,
          firstName,
          firstLastName,
          email: updatedMember.email,
          birthDate: updatedMember.birthDate,
          mobilePhone: updatedMember.mobilePhone,
          address: updatedMember.address,
          createdByChurchId: churchId,
        });

        const duplicate = await this.provider.findByPersonId(
          String(resolvedPerson._id),
          churchId,
          memberId,
        );

        if (duplicate) {
          return {
            isSuccessful: false,
            message: 'El número de cédula ya está registrado',
          };
        }

        const activeElsewhere = await this.provider.findActiveMemberByPersonId(
          String(resolvedPerson._id),
        );

        if (activeElsewhere && String(activeElsewhere._id) !== memberId) {
          return {
            isSuccessful: false,
            message: 'El miembro ya se encuentra activo en otra iglesia',
          };
        }

        await this.provider.updatePersonId(
          memberId,
          String(resolvedPerson._id),
        );
        person = resolvedPerson;
      }

      if (person) {
        await this.personProvider.updateBasicInfo(person._id, {
          firstName,
          firstLastName,
          documentType: updatedMember.documentType,
          email: updatedMember.email,
          mobilePhone: updatedMember.mobilePhone,
          landLine: updatedMember.landLine,
          address: updatedMember.address,
          housingType: updatedMember.housingType,
          maritalStatus: updatedMember.maritalStatus,
          educationalLevel: updatedMember.educationalLevel,
          occupation: updatedMember.occupation,
          birthDate: updatedMember.birthDate
            ? new Date(updatedMember.birthDate)
            : undefined,
        });
      }
    }

    return this.provider.updateGeneralMemberInfo(memberId, updatedMember);
  }

  private extractId(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'object' && value !== null && '_id' in value) {
      return String((value as { _id: unknown })._id);
    }
    return String(value);
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
}
