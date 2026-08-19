import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { LevelProvider } from 'src/providers/sundaySchool/level.provider';
import { SundaySchoolClassProvider } from 'src/providers/sundaySchool/class.provider';
import {
  CreateClassDto,
  UpdateClassDto,
} from 'src/schemas/sundaySchool/class.DTO';
import { SundaySchoolClass } from 'src/schemas/sundaySchool/class.schema';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult } from 'src/dtos/pagination.dto';
import {
  deleteCloudinaryImageByUrl,
  getSignedPdfUrl,
  uploadImageBufferToCloudinary,
} from 'src/utilities/cloudinary';

export interface ClassUploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export interface WeeklyWindow {
  startOfWeek: Date;
  endOfWeek: Date;
}

const SUNDAY_SCHOOL_CLASSES_FOLDER = 'mychurchcrm/sundaySchool/classes';

const MAESTRO_ROLE = 'Maestro Escuela Dominical';

const EMPTY_RESULT: PaginatedResult<SundaySchoolClass> = {
  data: [],
  metadata: { currentPage: 1, totalPages: 0, totalRecords: 0 },
};

@Injectable()
export class SundaySchoolClassBusiness {
  private readonly logger = new Logger(SundaySchoolClassBusiness.name);

  constructor(
    private readonly provider: SundaySchoolClassProvider,
    private readonly levelProvider: LevelProvider,
  ) {}

  async getAll(
    churchId?: string,
    levelId?: string,
    page?: number,
    limit?: number,
    userId?: string,
  ): Promise<PaginatedResult<SundaySchoolClass>> {
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

        if (!levelId) {
          levelIds = teacherLevelIds;
        }
      }
    }

    const result = await this.provider.getAllByChurch(
      churchId,
      levelIds,
      page,
      limit,
    );

    return {
      data: result.data.map((item) => this.withSignedPdfUrl(item)),
      metadata: result.metadata,
    };
  }

  async getById(
    id: string,
    userId?: string,
  ): Promise<SundaySchoolClass | null> {
    const item = await this.provider.getById(id);

    if (!item) {
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

        const classLevelIds = (item.levelIds || []).map((levelId) =>
          levelId.toString(),
        );

        if (
          !classLevelIds.some((levelId) => teacherLevelIds.includes(levelId))
        ) {
          return null;
        }
      }
    }

    return this.withSignedPdfUrl(item);
  }

  async create(
    dto: CreateClassDto,
    churchId?: string,
    file?: ClassUploadFile,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    if (!churchId) {
      response.message = 'No se pudo determinar la iglesia del usuario';

      return response;
    }

    if (!file || !file.buffer) {
      response.message = 'El archivo PDF de la clase es obligatorio';

      return response;
    }

    if (file.mimetype !== 'application/pdf') {
      response.message = 'El archivo debe ser un PDF';

      return response;
    }

    const levelIds = this.parseLevelIds(dto.levelIds);
    const levels = await this.levelProvider.getLevelsByIdsAndChurch(
      levelIds,
      churchId,
    );

    if (levels.length !== levelIds.length) {
      this.logger.warn(
        `[create] Some levels do not belong to church ${churchId}: ${levelIds.join(
          ', ',
        )}`,
      );
      response.message = 'Algunos niveles no pertenecen a esta iglesia';

      return response;
    }

    const date = this.parseDate(dto.date);

    if (!date) {
      response.message = 'La fecha de la clase no es válida';

      return response;
    }

    const duplicateClass = await this.provider.findByDateAndLevels(
      churchId,
      date,
      levelIds,
    );

    if (duplicateClass) {
      response.message =
        'Ya existe una clase para esta fecha con uno de los niveles seleccionados';

      return response;
    }

    try {
      const pdfUrl = await uploadImageBufferToCloudinary(
        file.buffer,
        SUNDAY_SCHOOL_CLASSES_FOLDER,
        file.originalname,
      );

      response.data = this.withSignedPdfUrl(
        await this.provider.create({
          lessonName: dto.lessonName,
          pdfUrl,
          levelIds,
          date,
          churchId,
        }),
      );
      response.isSuccessful = true;

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[create] Error uploading class PDF: ${err.message}`,
        err.stack,
      );
      response.message = 'No se pudo subir el PDF de la clase';

      return response;
    }
  }

  async update(
    id: string,
    dto: UpdateClassDto,
    churchId?: string,
    file?: ClassUploadFile,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    const existingClass = await this.provider.getById(id);

    if (!existingClass) {
      response.message = 'La clase no es válida';

      return response;
    }

    if (churchId && existingClass.churchId.toString() !== churchId) {
      response.message = 'La clase no pertenece a esta iglesia';

      return response;
    }

    const data: {
      lessonName?: string;
      date?: Date;
      levelIds?: string[];
      pdfUrl?: string;
    } = {};

    if (dto.lessonName !== undefined) {
      data.lessonName = dto.lessonName;
    }

    if (dto.date !== undefined) {
      const date = this.parseDate(dto.date);

      if (!date) {
        response.message = 'La fecha de la clase no es válida';

        return response;
      }

      data.date = date;
    }

    if (dto.levelIds !== undefined) {
      const levelIds = this.parseLevelIds(dto.levelIds);
      const levels = await this.levelProvider.getLevelsByIdsAndChurch(
        levelIds,
        existingClass.churchId.toString(),
      );

      if (levels.length !== levelIds.length) {
        response.message = 'Algunos niveles no pertenecen a esta iglesia';

        return response;
      }

      data.levelIds = levelIds;
    }

    if (file && file.buffer) {
      if (file.mimetype !== 'application/pdf') {
        response.message = 'El archivo debe ser un PDF';

        return response;
      }

      try {
        data.pdfUrl = await uploadImageBufferToCloudinary(
          file.buffer,
          SUNDAY_SCHOOL_CLASSES_FOLDER,
          file.originalname,
        );
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `[update] Error uploading class PDF: ${err.message}`,
          err.stack,
        );
        response.message = 'No se pudo subir el PDF de la clase';

        return response;
      }
    }

    try {
      response.data = this.withSignedPdfUrl(
        await this.provider.update(id, data),
      );

      if (
        data.pdfUrl &&
        existingClass.pdfUrl &&
        existingClass.pdfUrl !== data.pdfUrl
      ) {
        try {
          await deleteCloudinaryImageByUrl(existingClass.pdfUrl);
        } catch (error) {
          this.logger.warn(
            `[update] Failed to delete previous class PDF: ${existingClass.pdfUrl}`,
          );
        }
      }

      response.isSuccessful = true;

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[update] Error updating class ${id}: ${err.message}`,
        err.stack,
      );
      response.message = 'No se pudo actualizar la clase';

      return response;
    }
  }

  async remove(id: string): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    const existingClass = await this.provider.getById(id);

    if (!existingClass) {
      response.message = 'La clase no es válida';

      return response;
    }

    await this.provider.delete(id);

    if (existingClass.pdfUrl) {
      try {
        await deleteCloudinaryImageByUrl(existingClass.pdfUrl);
      } catch (error) {
        this.logger.warn(
          `[remove] Failed to delete class PDF from Cloudinary: ${existingClass.pdfUrl}`,
        );
      }
    }

    response.isSuccessful = true;
    response.message = 'Clase eliminada correctamente';

    return response;
  }

  /**
   * Replaces the stored PDF URL with a signed, expiring delivery URL so the
   * browser can render the PDF even when the account restricts PDF delivery.
   * Converts Mongoose documents to plain objects first so the response does
   * not leak internal document state ($__, _doc, etc.).
   */
  private withSignedPdfUrl<T extends { pdfUrl?: string }>(item: T): T {
    if (!item.pdfUrl) {
      return item;
    }

    const doc = item as T & { toObject?: () => T };
    const plain =
      typeof doc.toObject === 'function' ? doc.toObject() : { ...item };

    return { ...plain, pdfUrl: getSignedPdfUrl(item.pdfUrl) };
  }

  /**
   * Returns the Sunday-Saturday window that contains the given date.
   * The Sunday School week starts on Sunday (class day) and ends on Saturday.
   * Dates arrive as YYYY-MM-DD strings (parsed as UTC midnight), so the
   * window is computed with UTC methods to avoid depending on the server
   * timezone.
   */
  getWeeklyWindow(date?: string): WeeklyWindow {
    const referenceDate = date ? new Date(date) : new Date();

    if (isNaN(referenceDate.getTime())) {
      throw new BadRequestException('La fecha no es válida');
    }

    const dayOfWeek = referenceDate.getUTCDay(); // 0 = Sunday
    const diffToSunday = -dayOfWeek;

    const startOfWeek = new Date(referenceDate);
    startOfWeek.setUTCDate(referenceDate.getUTCDate() + diffToSunday);
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  }

  /**
   * Returns the class assigned for the week that contains the given date,
   * optionally filtered by level. Used to prefill the attendance form and to
   * validate that a class exists before registering attendance.
   */
  async getForAttendanceDate(
    date: string,
    churchId?: string,
    levelId?: string,
  ): Promise<SundaySchoolClass | null> {
    if (!churchId) {
      return null;
    }

    const { startOfWeek, endOfWeek } = this.getWeeklyWindow(date);
    const item = await this.provider.findForWeek(
      churchId,
      startOfWeek,
      endOfWeek,
      levelId,
    );

    return item ? this.withSignedPdfUrl(item) : null;
  }

  private parseLevelIds(value: string): string[] {
    if (!value) {
      throw new BadRequestException('levelIds es obligatorio');
    }

    let levelIds: unknown;

    try {
      levelIds = JSON.parse(value);
    } catch {
      throw new BadRequestException('levelIds debe ser un arreglo JSON');
    }

    if (!Array.isArray(levelIds) || levelIds.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos un nivel');
    }

    const invalidId = levelIds.find(
      (id) => typeof id !== 'string' || !Types.ObjectId.isValid(id),
    );

    if (invalidId) {
      throw new BadRequestException(
        'levelIds contiene un identificador inválido',
      );
    }

    return levelIds as string[];
  }

  private parseDate(value: string): Date | null {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  }
}
