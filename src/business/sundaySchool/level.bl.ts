import { Injectable, Logger } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { LevelProvider } from 'src/providers/sundaySchool/level.provider';
import { CreateLevelDto, UpdateLevelDto } from 'src/schemas/level/level.DTO';
import { Level, LevelDocument } from 'src/schemas/level/level.schema';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';

const MAESTRO_ROLE = 'Maestro Escuela Dominical';

@Injectable()
export class LevelBusiness {
  private readonly logger = new Logger(LevelBusiness.name);

  constructor(private readonly provider: LevelProvider) {}

  async getAllByChurch(
    churchId?: string,
    search?: string,
    userId?: string,
  ): Promise<Level[]> {
    if (!churchId) {
      return [];
    }

    let scopeFilter: FilterQuery<LevelDocument> | undefined;

    if (userId) {
      const { roleNames, memberId } = await this.provider.getUserScopeInfo(
        userId,
      );

      if (roleNames.includes(MAESTRO_ROLE) && memberId) {
        scopeFilter = { teachers: memberId };
      }
    }

    this.logger.log(
      `[getAllByChurch] Loading levels for church ${churchId}${
        scopeFilter ? ' (scoped)' : ''
      }`,
    );

    return this.provider.getAllByChurch(churchId, search, scopeFilter);
  }

  async getById(id: string, userId?: string): Promise<Level | null> {
    if (userId) {
      const { roleNames, memberId } = await this.provider.getUserScopeInfo(
        userId,
      );

      if (roleNames.includes(MAESTRO_ROLE) && memberId) {
        const teacherLevelIds = await this.provider.getLevelIdsByTeacher(
          memberId,
        );

        if (!teacherLevelIds.includes(id)) {
          return null;
        }
      }
    }

    return this.provider.getById(id);
  }

  async create(
    level: CreateLevelDto,
    churchId: string,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    if (!churchId) {
      response.message = 'No se pudo determinar la iglesia del usuario';

      return response;
    }

    if (level.minAge > level.maxAge) {
      response.message = 'La edad mínima no puede ser mayor que la edad máxima';

      return response;
    }

    const existingLevel = await this.provider.findByNameAndChurch(
      level.name,
      churchId,
    );

    if (existingLevel) {
      this.logger.warn(
        `[create] Duplicate level name "${level.name}" for church ${churchId}`,
      );
      response.message = 'Ya existe un nivel con este nombre en la iglesia';

      return response;
    }

    response.data = await this.provider.create({ ...level, churchId });
    response.isSuccessful = true;

    return response;
  }

  async update(id: string, level: UpdateLevelDto): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    const existingLevel = await this.provider.getById(id);

    if (!existingLevel) {
      response.message = 'El nivel no es válido';

      return response;
    }

    if (
      level.minAge !== undefined &&
      level.maxAge !== undefined &&
      level.minAge > level.maxAge
    ) {
      response.message = 'La edad mínima no puede ser mayor que la edad máxima';

      return response;
    }

    if (level.name) {
      const duplicate = await this.provider.findByNameAndChurch(
        level.name,
        existingLevel.churchId.toString(),
      );

      if (duplicate && duplicate._id.toString() !== id) {
        response.message = 'Ya existe un nivel con este nombre en la iglesia';

        return response;
      }
    }

    response.data = await this.provider.update(id, level);
    response.isSuccessful = true;

    return response;
  }

  async remove(id: string): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    const existingLevel = await this.provider.getById(id);

    if (!existingLevel) {
      response.message = 'El nivel no es válido';

      return response;
    }

    const studentsCount = await this.provider.countStudentsByLevel(id);

    if (studentsCount > 0) {
      response.message =
        'No se puede eliminar el nivel porque tiene estudiantes asignados';

      return response;
    }

    await this.provider.delete(id);
    response.isSuccessful = true;
    response.message = 'Nivel eliminado correctamente';

    return response;
  }
}
