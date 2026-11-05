import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Members, MemberDocument } from 'src/schemas/member/member.shema';
import {
  MemberGeneralInfoDto,
  AdditionalAcademicStudyDto,
  RelativeDto,
  MemberMinistryStudyDto,
  ChangeMemberStatusDto,
} from 'src/schemas/member/Member.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult, calculatePagination } from 'src/dtos/pagination.dto';
import { PersonProvider } from 'src/providers/person/person.provider';
import { withLegacyMemberFields } from 'src/utils/legacy-identity.util';

@Injectable()
export class MemberProvider {
  private readonly logger = new Logger(MemberProvider.name);

  constructor(
    @InjectModel(Members.name) private memberModel: Model<MemberDocument>,
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
      throw new Error('churchId is required');
    }

    const { skip } = calculatePagination({ page, limit });

    const filter: FilterQuery<MemberDocument> = {};
    filter.churchId = churchId;

    if (workfrontId) {
      filter.workfront = workfrontId;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      const personIds = await this.personProvider.findIdsBySearch(search);

      filter.$or = [{ personId: { $in: personIds } }];
    }

    const baseQuery = this.memberModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: 'personId', model: 'Person' })
      .lean();

    const populatedQuery = churchId
      ? baseQuery.populate({ path: 'workfront', model: 'Workfront' })
      : baseQuery;

    const [data, totalRecords] = await Promise.all([
      populatedQuery.skip(skip).limit(limit || 10),
      this.memberModel.countDocuments(filter),
    ]);

    const { page: currentPage, limit: pageSize } = calculatePagination({
      page,
      limit,
    });
    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
      data: data.map((member) =>
        withLegacyMemberFields(member),
      ) as unknown as Members[],
      metadata: { currentPage, totalPages, totalRecords },
    };
  }

  // This method retrieves the personIds of members that match the provided personIds and optional churchId.
  async findMemberPersonIds(
    personIds: string[],
    churchId?: string,
  ): Promise<string[]> {
    if (!personIds.length) return [];

    const filter: FilterQuery<MemberDocument> = {
      personId: { $in: personIds },
    };

    if (churchId) {
      filter.churchId = churchId;
    }

    const members = await this.memberModel
      .find(filter)
      .select('personId')
      .lean();

    return members
      .map((member) => String((member as { personId?: unknown }).personId))
      .filter((personId) => personId && personId !== 'undefined');
  }

  // Search for active membership for a person (without filtering by church).
  // Used to validate the rule: "one active church".
  async findActiveMemberByPersonId(personId: string) {
    if (!personId) return null;
    return this.memberModel.findOne({ personId, status: 'active' }).lean();
  }

  async findByPersonId(
    personId: string,
    churchId: string,
    excludeId?: string,
  ): Promise<MemberDocument | null> {
    const filter: FilterQuery<MemberDocument> = { personId, churchId };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return this.memberModel.findOne(filter).lean();
  }

  async updatePersonId(memberId: string, personId: string): Promise<void> {
    await this.memberModel.updateOne({ _id: memberId }, { $set: { personId } });
  }

  async getMemberById(id: string, churchId?: string): Promise<Members | null> {
    const filter: FilterQuery<MemberDocument> = { _id: id };
    if (churchId) {
      filter.churchId = churchId;
    }

    const member = await this.memberModel
      .findOne(filter)
      .populate({
        path: 'workfront',
        model: 'Workfront',
      })
      .populate({ path: 'personId', model: 'Person' })
      .lean();

    if (!member) return null;

    return withLegacyMemberFields(member) as unknown as Members;
  }

  async changeStatus(
    memberId: string,
    statusData: ChangeMemberStatusDto,
    churchId: string,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: true };

    try {
      if (!churchId) {
        response.isSuccessful = false;
        response.message = 'churchId is required';
        return response;
      }

      const filterExisting: FilterQuery<MemberDocument> = { _id: memberId };
      if (churchId) {
        filterExisting.churchId = churchId;
      }

      const existingMember = await this.memberModel.findOne(filterExisting);

      if (!existingMember) {
        response.isSuccessful = false;
        response.message = 'Persona no encontrada.';
        return response;
      }

      const personId = (existingMember as { personId?: unknown }).personId;

      if (!personId) {
        response.isSuccessful = false;
        response.message =
          'No es posible validar el cambio de estado sin personId.';
        return response;
      }

      if (statusData.status === 'active') {
        // Check if the member is already active in another church (by personId)
        const filterActiveOther: FilterQuery<MemberDocument> = {
          _id: { $ne: memberId },
          churchId: { $ne: existingMember.churchId },
          status: 'active',
          personId,
        };

        const activeInOtherChurch = await this.memberModel.findOne(
          filterActiveOther,
        );

        if (activeInOtherChurch) {
          response.isSuccessful = false;
          response.message =
            'El miembro ya se encuentra activo en otra iglesia';

          return response;
        }

        await this.memberModel.updateOne(
          { _id: memberId },
          {
            $set: {
              status: 'active',
              inactiveDate: null,
              inactiveReason: null,
            },
          },
        );
      } else {
        const filterActiveOther: FilterQuery<MemberDocument> = {
          _id: { $ne: memberId },
          churchId: { $ne: existingMember.churchId },
          status: 'active',
          personId,
        };

        const activeInOtherChurch = await this.memberModel.findOne(
          filterActiveOther,
        );

        if (activeInOtherChurch) {
          response.isSuccessful = false;
          response.message =
            'El miembro ya se encuentra activo en otra iglesia';
          return response;
        }

        await this.memberModel.updateOne(
          { _id: memberId },
          {
            $set: {
              status: 'inactive',
              inactiveDate: new Date(),
              inactiveReason: statusData.inactiveReason || null,
            },
          },
        );
      }

      const updatedMember = await this.memberModel
        .findOne({ _id: memberId, churchId })
        .populate({ path: 'workfront', model: 'Workfront' })
        .populate({ path: 'personId', model: 'Person' })
        .lean();

      response.data = updatedMember
        ? withLegacyMemberFields(updatedMember)
        : null;

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[changeStatus] Error updating member status: ${err.message}`,
        err.stack,
      );
      response.isSuccessful = false;
      response.message = 'Error actualizando el estado del miembro.';
      return response;
    }
  }

  async create(
    member: MemberGeneralInfoDto,
    personId: string,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: true };

    try {
      const existingInChurch = await this.memberModel.findOne({
        personId,
        churchId: member.churchId,
      });

      if (existingInChurch) {
        if (existingInChurch.status === 'inactive') {
          response.isSuccessful = false;
          response.message = 'El miembro se encuentra inactivo en esta iglesia';
          response.data = await this.getMemberById(
            String(existingInChurch._id),
            String(member.churchId),
          );
          return response;
        }

        response.message = 'El número de cédula ya está registrado';
        response.isSuccessful = false;
        return response;
      }

      const activeInOtherChurch = await this.memberModel.findOne({
        personId,
        churchId: { $ne: member.churchId },
        status: 'active',
      });

      if (activeInOtherChurch) {
        response.message = 'El miembro ya se encuentra activo en otra iglesia';
        response.isSuccessful = false;
        return response;
      }

      const newMember = await this.memberModel.create({
        personId,
        churchId: member.churchId,
        conversionyear: member.conversionyear,
        yearInChurch: member.yearInChurch,
        isBaptised: member.isBaptised,
        workfront: member.workfront || null,
        comments: member.comments,
      });

      response.data = await this.getMemberById(
        String(newMember._id),
        String(member.churchId),
      );

      return response;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[create] Error creating member: ${err.message}`,
        err.stack,
      );
      response.isSuccessful = false;

      const errMsg = error as { errmsg?: string; message?: unknown };

      response.message =
        (typeof errMsg?.errmsg === 'string' &&
          errMsg.errmsg.includes('duplicate key')) ||
        (typeof errMsg?.message === 'string' &&
          errMsg.message.includes('duplicate key'))
          ? 'El usuario ya se encuentra registrado'
          : 'Se ha presentado un error creando el miembro';

      return response;
    }
  }

  async updateGeneralMemberInfo(
    memberId: string,
    updatedMember: MemberGeneralInfoDto,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: true };

    try {
      const existingMember = await this.memberModel.findOne({
        _id: memberId,
      });

      if (!existingMember) {
        response.isSuccessful = false;
        response.message = 'Persona no encontrada.';
        return response;
      }

      try {
        await this.memberModel.updateOne(
          {
            _id: memberId,
          },
          {
            $set: {
              conversionyear: updatedMember.conversionyear,
              isBaptised: updatedMember.isBaptised,
              yearInChurch: updatedMember.yearInChurch,
              workfront: updatedMember.workfront || null,
              comments: updatedMember.comments,
            },
          },
        );

        response.data = await this.getMemberById(memberId);

        return response;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `[updateGeneralMemberInfo] Error updating general info: ${err.message}`,
          err.stack,
        );

        response.isSuccessful = false;
        response.message = 'Error actualizando la información general.';
        return response;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[updateGeneralMemberInfo] Error updating general info: ${err.message}`,
        err.stack,
      );
      response.isSuccessful = false;
      response.message = 'Error actualizando la información general.';
      return response;
    }
  }

  async updateAdditionalAcademicStudies(
    memberId: string,
    additionalAcademicData: AdditionalAcademicStudyDto,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: true };

    try {
      const existingMember = await this.memberModel.findOne({
        _id: memberId,
      });

      if (!existingMember) {
        response.isSuccessful = false;
        response.message = 'Persona no encontrada.';
        return response;
      }

      try {
        if (additionalAcademicData._id) {
          const filterStudies = existingMember.additionalAcademicStudies.filter(
            (study) => {
              return study._id.toString() === additionalAcademicData._id;
            },
          );

          if (filterStudies.length === 0) {
            response.isSuccessful = false;
            response.message = 'Información académica inválida';

            return response;
          }

          await this.memberModel.findOneAndUpdate(
            {
              _id: memberId,
              'additionalAcademicStudies._id': additionalAcademicData._id,
            },
            {
              $set: {
                'additionalAcademicStudies.$.name': additionalAcademicData.name,
                'additionalAcademicStudies.$.AcademicInstitutionName':
                  additionalAcademicData.AcademicInstitutionName,
                'additionalAcademicStudies.$.isFinished':
                  additionalAcademicData.isFinished,
                'additionalAcademicStudies.$.comments':
                  additionalAcademicData.comments,
              },
            },
          );
        } else {
          const newStudy = {
            name: additionalAcademicData.name,
            isFinished: additionalAcademicData.isFinished,
            AcademicInstitutionName:
              additionalAcademicData.AcademicInstitutionName,
            comments: additionalAcademicData.comments,
          };

          await this.memberModel.updateOne(
            {
              _id: memberId,
            },
            {
              $push: { additionalAcademicStudies: newStudy },
            },
            {
              new: true,
            },
          );
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `[updateAdditionalAcademicStudies] Error updating academic studies: ${err.message}`,
          err.stack,
        );

        response.isSuccessful = false;
        response.message = 'Error actualizando la información académica.';

        return response;
      }

      response.data = await this.getMemberById(memberId);

      return response;
    } catch (error) {
      response.isSuccessful = false;
      response.message = 'Error actualizando la información académica.';
      return response;
    }
  }

  async updateRelativeInformation(
    memberId: string,
    relativeData: RelativeDto,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: true };

    try {
      const existingMember = await this.memberModel.findOne({
        _id: memberId,
      });

      if (!existingMember) {
        response.isSuccessful = false;
        response.message = 'Persona no encontrada.';
        return response;
      }

      try {
        if (relativeData._id) {
          const filterRelatives = existingMember.relatives.filter(
            (relative) => {
              return relative._id.toString() === relativeData._id;
            },
          );

          if (filterRelatives.length === 0) {
            response.isSuccessful = false;
            response.message = 'Información familiar inválida';

            return response;
          }

          await this.memberModel.findOneAndUpdate(
            {
              _id: memberId,
              'relatives._id': relativeData._id,
            },
            {
              $set: {
                'relatives.$.name': relativeData.name,
                'relatives.$.address': relativeData.address,
                'relatives.$.mobilePhone': relativeData.mobilePhone,
                'relatives.$.email': relativeData.email,
                'relatives.$.birthDate': relativeData.birthDate,
                'relatives.$.educationalLevel': relativeData.educationalLevel,
                'relatives.$.occupation': relativeData.occupation,
                'relatives.$.kinship': relativeData.kinship,
                'relatives.$.comments': relativeData.comments,
              },
            },
          );
        } else {
          const newRelative: Omit<RelativeDto, '_id'> & {
            isMember?: boolean;
            Member?: unknown;
          } = {
            name: relativeData.name,
            address: relativeData.address,
            mobilePhone: relativeData.mobilePhone,
            email: relativeData.email,
            birthDate: relativeData.birthDate,
            educationalLevel: relativeData.educationalLevel,
            occupation: relativeData.occupation,
            kinship: relativeData.kinship,
            documentNumber: relativeData.documentNumber,
            comments: relativeData.comments,
          };
          const relativePerson = await this.personProvider.findByDocumentNumber(
            relativeData.documentNumber,
          );
          const memberRelative = relativePerson
            ? await this.memberModel.findOne({
                personId: relativePerson._id,
                churchId: existingMember.churchId,
              })
            : null;

          if (memberRelative) {
            (newRelative.isMember = true),
              (newRelative.Member = memberRelative._id);
          }

          await this.memberModel.updateOne(
            {
              _id: memberId,
            },
            {
              $push: { relatives: newRelative },
            },
            {
              new: true,
            },
          );
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `[updateRelativeInformation] Error updating relative info: ${err.message}`,
          err.stack,
        );

        response.isSuccessful = false;
        response.message = 'Error actualizando la información familiar.';
        return response;
      }

      response.data = await this.getMemberById(memberId);

      return response;
    } catch (error) {
      response.isSuccessful = false;
      response.message = 'Error actualizando la información familiar.';
      return response;
    }
  }

  async updateMinistryStudies(
    memberId: string,
    ministryStudiesData: MemberMinistryStudyDto,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: true };

    try {
      const existingMember = await this.memberModel.findOne({
        _id: memberId,
      });

      if (!existingMember) {
        response.isSuccessful = false;
        response.message = 'Persona no encontrada.';
        return response;
      }

      try {
        if (ministryStudiesData._id) {
          const filterMinistryStudies = existingMember.ministryStudies.filter(
            (ministryStudy) => {
              return ministryStudy._id.toString() === ministryStudiesData._id;
            },
          );

          if (filterMinistryStudies.length === 0) {
            response.isSuccessful = false;
            response.message = 'Información de estudios ministeriales inválida';

            return response;
          }

          await this.memberModel.findOneAndUpdate(
            {
              _id: memberId,
              'ministryStudies._id': ministryStudiesData._id,
            },
            {
              $set: {
                'ministryStudies.$.name': ministryStudiesData.name,
                'ministryStudies.$.startDate': ministryStudiesData.startDate,
                'ministryStudies.$.endDate': ministryStudiesData.endDate,
                'ministryStudies.$.status': ministryStudiesData.status,
                'ministryStudies.$.comments': ministryStudiesData.comments,
              },
            },
          );
        } else {
          const newMinistryStudy = {
            name: ministryStudiesData.name,
            startDate: ministryStudiesData.startDate,
            endDate: ministryStudiesData.endDate,
            status: ministryStudiesData.status,
            comments: ministryStudiesData.comments,
          };

          await this.memberModel.updateOne(
            {
              _id: memberId,
            },
            {
              $push: { ministryStudies: newMinistryStudy },
            },
            {
              new: true,
            },
          );
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `[updateMinistryStudies] Error updating ministry studies: ${err.message}`,
          err.stack,
        );

        response.isSuccessful = false;
        response.message = 'Información de estudios ministeriales inválida.';

        return response;
      }

      response.data = await this.getMemberById(memberId);

      return response;
    } catch (error) {
      response.isSuccessful = false;
      response.message = 'Información de estudios ministeriales inválida.';
      return response;
    }
  }
}
