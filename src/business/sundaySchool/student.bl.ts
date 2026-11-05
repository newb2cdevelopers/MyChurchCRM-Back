import { Injectable, Logger } from '@nestjs/common';
import { StudentProvider } from 'src/providers/sundaySchool/student.provider';
import { LevelProvider } from 'src/providers/sundaySchool/level.provider';
import {
  CreateStudentDto,
  UpdateStudentDto,
} from 'src/schemas/student/student.DTO';
import { Students } from 'src/schemas/student/student.schema';
import { StudentDocument } from 'src/schemas/student/student.schema';
import { Level, LevelDocument } from 'src/schemas/level/level.schema';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult } from 'src/dtos/pagination.dto';
import { PersonProvider } from 'src/providers/person/person.provider';
import { LevelEnrollmentProvider } from 'src/providers/sundaySchool/levelEnrollment.provider';
import { PersonSnapshot } from 'src/utils/legacy-identity.util';

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
    private readonly personProvider: PersonProvider,
    private readonly enrollmentProvider: LevelEnrollmentProvider,
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
      const { roleNames, teacherMemberId } =
        await this.levelProvider.getUserScopeInfo(userId);

      if (roleNames.includes(MAESTRO_ROLE)) {
        if (!teacherMemberId) {
          return EMPTY_RESULT;
        }

        const teacherLevelIds = await this.levelProvider.getLevelIdsByTeacher(
          teacherMemberId,
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
      const { roleNames, teacherMemberId } =
        await this.levelProvider.getUserScopeInfo(userId);

      if (roleNames.includes(MAESTRO_ROLE)) {
        if (!teacherMemberId) {
          return null;
        }

        const teacherLevelIds = await this.levelProvider.getLevelIdsByTeacher(
          teacherMemberId,
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

    // Resolve or create the canonical person so the student profile links to
    // the single source of identity instead of duplicating personal data.
    const person = await this.personProvider.resolveOrCreate({
      documentType: student.documentType,
      documentNumber: student.documentNumber,
      firstName: student.name,
      firstLastName: student.lastName,
      birthDate: student.birthDate,
      createdByChurchId: churchId,
    });

    const existingStudent = await this.provider.findByPersonId(
      String(person._id),
      churchId,
    );

    if (existingStudent) {
      this.logger.warn(
        `[create] Duplicate person "${person._id}" for church ${churchId}`,
      );
      response.message = 'Ya existe un estudiante con este número de documento';

      return response;
    }

    const createdStudent = await this.provider.create({
      ...student,
      churchId,
      personId: person._id,
    });

    await this.enrollmentProvider.create({
      studentId: String(createdStudent._id),
      levelId: student.levelId,
      churchId,
    });

    response.data = await this.provider.getById(String(createdStudent._id));
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
    const existingPerson = (
      existingStudent as StudentDocument & { person?: PersonSnapshot }
    ).person;

    if (student.levelId) {
      const level = await this.levelProvider.getById(student.levelId);

      if (!level || level.churchId.toString() !== churchId) {
        response.message =
          'El nivel seleccionado no es válido para esta iglesia';

        return response;
      }
    }

    const hasIdentityUpdate = Boolean(
      student.name ||
        student.lastName ||
        student.documentType ||
        student.documentNumber ||
        student.birthDate,
    );

    let personId = this.extractId(existingStudent.personId);

    if (hasIdentityUpdate) {
      let person = personId
        ? await this.personProvider.findById(personId)
        : null;

      if (student.documentNumber) {
        const documentType =
          student.documentType || existingPerson?.documentType;

        if (!documentType) {
          response.message = 'El tipo de documento es obligatorio';

          return response;
        }

        person = await this.personProvider.resolveOrCreate({
          documentType,
          documentNumber: student.documentNumber,
          firstName: student.name || existingPerson?.firstName || '',
          firstLastName: student.lastName || existingPerson?.firstLastName,
          birthDate: student.birthDate,
          createdByChurchId: churchId,
        });

        const duplicate = await this.provider.findByPersonId(
          String(person._id),
          churchId,
          id,
        );

        if (duplicate) {
          response.message =
            'Ya existe un estudiante con este número de documento';

          return response;
        }
      }

      if (!person) {
        response.message = 'No se pudo actualizar la identidad del estudiante';

        return response;
      }

      await this.personProvider.updateBasicInfo(person._id, {
        firstName: student.name,
        firstLastName: student.lastName,
        documentType: student.documentType,
        birthDate: student.birthDate ? new Date(student.birthDate) : undefined,
      });

      personId = String(person._id);
    }

    const previousLevelId = this.extractId(existingStudent.levelId);
    const nextLevelId = student.levelId ? String(student.levelId) : null;

    response.data = await this.provider.update(
      id,
      student,
      personId || undefined,
    );

    // Keep the enrollment history in sync when the level changes.
    if (nextLevelId && nextLevelId !== previousLevelId) {
      await this.enrollmentProvider.closeActive([id], 'promoted');
      await this.enrollmentProvider.create({
        studentId: id,
        levelId: nextLevelId,
        churchId,
      });
    }

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

    await this.enrollmentProvider.closeActive([id], 'withdrawn');
    await this.provider.delete(id);
    response.isSuccessful = true;
    response.message = 'Estudiante eliminado correctamente';

    return response;
  }

  private extractId(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'object' && value !== null && '_id' in value) {
      return String((value as { _id: unknown })._id);
    }
    return String(value);
  }

  async getPromotionPreview(levelId: string, userId?: string) {
    const level = await this.levelProvider.getById(levelId);

    if (!level) {
      return null;
    }

    const churchId = level.churchId.toString();

    if (userId) {
      const { roleNames, teacherMemberId } =
        await this.levelProvider.getUserScopeInfo(userId);

      if (roleNames.includes(MAESTRO_ROLE)) {
        if (!teacherMemberId) {
          return null;
        }

        const teacherLevelIds = await this.levelProvider.getLevelIdsByTeacher(
          teacherMemberId,
        );

        if (!teacherLevelIds.includes(levelId)) {
          return null;
        }
      }
    }

    const [allLevels, students] = await Promise.all([
      this.levelProvider.getAllByChurch(churchId),
      this.provider.getForPromotion(levelId),
    ]);

    const nextLevel = this.findNextLevel(allLevels || [], level);

    return {
      level,
      nextLevel,
      isLastLevel: !nextLevel,
      students,
    };
  }

  async promote(
    levelId: string,
    studentIds: string[],
    userId?: string,
    churchId?: string,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    const level = await this.levelProvider.getById(levelId);

    if (!level) {
      response.message = 'El nivel seleccionado no es válido';

      return response;
    }

    const currentChurchId = level.churchId.toString();

    if (churchId && currentChurchId !== churchId) {
      response.message = 'El nivel no pertenece a tu iglesia';

      return response;
    }

    if (userId) {
      const { roleNames, teacherMemberId } =
        await this.levelProvider.getUserScopeInfo(userId);

      if (roleNames.includes(MAESTRO_ROLE)) {
        if (!teacherMemberId) {
          response.message =
            'No tienes una membresía activa para acceder a Escuela Dominical';
          return response;
        }

        const teacherLevelIds = await this.levelProvider.getLevelIdsByTeacher(
          teacherMemberId,
        );

        if (!teacherLevelIds.includes(levelId)) {
          response.message =
            'Solo puedes promover estudiantes de tus niveles asignados';

          return response;
        }
      }
    }

    if (!studentIds?.length) {
      response.message =
        'Debe seleccionar al menos un estudiante para promover';

      return response;
    }

    const selectedStudents = await this.provider.getManyByIds(studentIds);

    if (selectedStudents.length !== studentIds.length) {
      response.message = 'Algunos estudiantes seleccionados no son válidos';

      return response;
    }

    const invalid = selectedStudents.some(
      (s) =>
        !s.levelId ||
        s.levelId.toString() !== levelId ||
        s.churchId?.toString() !== currentChurchId ||
        s.graduated,
    );

    if (invalid) {
      response.message =
        'Solo se pueden promover estudiantes que pertenezcan a este nivel';

      return response;
    }

    const allLevels = await this.levelProvider.getAllByChurch(currentChurchId);
    const nextLevel = this.findNextLevel(allLevels || [], level);

    if (nextLevel) {
      await this.provider.promoteMany(studentIds, {
        levelId: nextLevel._id.toString(),
      });
      // Close the current enrollment before opening the next one so the
      // single-active-enrollment index is respected.
      await this.enrollmentProvider.closeActive(studentIds, 'promoted');
      await this.enrollmentProvider.openMany(
        studentIds,
        nextLevel._id.toString(),
        currentChurchId,
      );
      this.logger.log(
        `[promote] Promoted ${studentIds.length} students from ${levelId} to ${nextLevel._id}`,
      );
      response.isSuccessful = true;
      response.message = `Se promovieron ${studentIds.length} estudiante(s) al nivel ${nextLevel.name}`;
      return response;
    }

    await this.provider.promoteMany(studentIds, {
      levelId: null,
      graduated: true,
      graduatedAt: new Date(),
    });
    await this.enrollmentProvider.closeActive(studentIds, 'graduated');
    this.logger.log(
      `[promote] Graduated ${studentIds.length} students from ${levelId}`,
    );
    response.isSuccessful = true;
    response.message = `Se graduaron ${studentIds.length} estudiante(s) de Escuela Dominical`;
    return response;
  }

  /**
   * Returns the next level in the age-based ordering (minAge ascending).
   * The next level is the one whose minAge is greater than the current
   * level's maxAge. Returns null when the current level is the last one.
   */
  private findNextLevel(
    levels: LevelDocument[],
    currentLevel: LevelDocument,
  ): Level | null {
    const sortedLevels = [...levels].sort((a, b) => {
      const aMin = a.minAge ?? 0;
      const bMin = b.minAge ?? 0;
      if (aMin !== bMin) return aMin - bMin;
      return (a.maxAge ?? 0) - (b.maxAge ?? 0);
    });

    const currentMaxAge = currentLevel.maxAge ?? 0;
    const currentId = currentLevel._id.toString();

    for (const l of sortedLevels) {
      const lMin = l.minAge ?? 0;
      if (l._id.toString() === currentId) continue;
      if (lMin > currentMaxAge) {
        return l;
      }
    }

    return null;
  }
}
