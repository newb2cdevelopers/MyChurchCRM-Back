import { Injectable, Logger } from '@nestjs/common';
import { StudentProvider } from 'src/providers/sundaySchool/student.provider';
import { LevelProvider } from 'src/providers/sundaySchool/level.provider';
import {
  CreateStudentDto,
  UpdateStudentDto,
} from 'src/schemas/student/student.DTO';
import { Students } from 'src/schemas/student/student.schema';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult } from 'src/dtos/pagination.dto';

const MAESTRO_ROLE = 'Maestro Escuela Dominical';

const EMPTY_RESULT: PaginatedResult<Students> = {
  data: [],
  metadata: { currentPage: 1, totalPages: 0, totalRecords: 0 },
};

@Injectable()
export class StudentBusiness {
  private readonly logger = new Logger(StudentBusiness.name);

  constructor(
    private readonly provider: StudentProvider,
    private readonly levelProvider: LevelProvider,
  ) {}

  async getAll(
    churchId?: string,
    levelId?: string,
    search?: string,
    page?: number,
    limit?: number,
    userId?: string,
  ): Promise<PaginatedResult<Students>> {
    if (!churchId) {
      return EMPTY_RESULT;
    }

    let levelIds: string[] | undefined;

    if (levelId) {
      levelIds = [levelId];
    }

    if (userId) {
      const { roleNames, memberId } = await this.levelProvider.getUserScopeInfo(
        userId,
      );

      if (roleNames.includes(MAESTRO_ROLE) && memberId) {
        const teacherLevelIds = await this.levelProvider.getLevelIdsByTeacher(
          memberId,
        );

        if (levelId && !teacherLevelIds.includes(levelId)) {
          return EMPTY_RESULT;
        }

        // Keep a specific levelId filter when provided; otherwise scope to
        // all the teacher's levels.
        if (!levelId) {
          levelIds = teacherLevelIds;
        }
      }
    }

    return this.provider.getAll(churchId, levelIds, search, page, limit);
  }

  async getById(id: string, userId?: string): Promise<Students | null> {
    const student = await this.provider.getById(id);

    if (!student) {
      return null;
    }

    if (userId) {
      const { roleNames, memberId } = await this.levelProvider.getUserScopeInfo(
        userId,
      );

      if (roleNames.includes(MAESTRO_ROLE) && memberId) {
        const teacherLevelIds = await this.levelProvider.getLevelIdsByTeacher(
          memberId,
        );

        if (!teacherLevelIds.includes(student.levelId.toString())) {
          return null;
        }
      }
    }

    return student;
  }

  async create(
    student: CreateStudentDto,
    churchId: string,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    if (!churchId) {
      response.message = 'No se pudo determinar la iglesia del usuario';

      return response;
    }

    const level = await this.levelProvider.getById(student.levelId);

    if (!level || level.churchId.toString() !== churchId) {
      response.message = 'El nivel seleccionado no es válido para esta iglesia';

      return response;
    }

    const existingStudent = await this.provider.findByDocument(
      student.documentNumber,
      churchId,
    );

    if (existingStudent) {
      this.logger.warn(
        `[create] Duplicate document "${student.documentNumber}" for church ${churchId}`,
      );
      response.message = 'Ya existe un estudiante con este número de documento';

      return response;
    }

    response.data = await this.provider.create({ ...student, churchId });
    response.isSuccessful = true;

    return response;
  }

  async update(
    id: string,
    student: UpdateStudentDto,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    const existingStudent = await this.provider.getById(id);

    if (!existingStudent) {
      response.message = 'El estudiante no es válido';

      return response;
    }

    const churchId = existingStudent.churchId.toString();

    if (student.levelId) {
      const level = await this.levelProvider.getById(student.levelId);

      if (!level || level.churchId.toString() !== churchId) {
        response.message =
          'El nivel seleccionado no es válido para esta iglesia';

        return response;
      }
    }

    if (student.documentNumber) {
      const duplicate = await this.provider.findByDocument(
        student.documentNumber,
        churchId,
        id,
      );

      if (duplicate) {
        response.message =
          'Ya existe un estudiante con este número de documento';

        return response;
      }
    }

    response.data = await this.provider.update(id, student);
    response.isSuccessful = true;

    return response;
  }

  async remove(id: string): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    const existingStudent = await this.provider.getById(id);

    if (!existingStudent) {
      response.message = 'El estudiante no es válido';

      return response;
    }

    await this.provider.delete(id);
    response.isSuccessful = true;
    response.message = 'Estudiante eliminado correctamente';

    return response;
  }
}
