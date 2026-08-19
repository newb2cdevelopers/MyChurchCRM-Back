import { Injectable, Logger } from '@nestjs/common';
import { Church } from 'src/schemas/churches/church.schema';
import { ChurchProvider } from 'src/providers/churches/church.provider';
import { ChurchServiceDto } from 'src/schemas/churches/church.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';

@Injectable()
export class ChurchBusiness {
  private readonly logger = new Logger(ChurchBusiness.name);

  constructor(private readonly provider: ChurchProvider) {}

  async getAllChurches(): Promise<Church[]> {
    return this.provider.getAllChurches() as unknown as Promise<Church[]>;
  }

  async getById(churchId: string): Promise<Church | null> {
    return this.provider.getById(churchId) as unknown as Promise<Church | null>;
  }

  async updateServices(
    churchId: string,
    services: ChurchServiceDto[],
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    const church = await this.provider.getById(churchId);

    if (!church) {
      response.message = 'La iglesia no es válida';

      return response;
    }

    const normalized = this.normalizeServices(services);

    if (!normalized) {
      response.message =
        'Cada servicio debe tener un día y una hora, sin duplicados';

      return response;
    }

    response.data = await this.provider.updateServices(churchId, normalized);
    response.isSuccessful = true;
    response.message = 'Servicios actualizados correctamente';

    return response;
  }

  /**
   * Trims day/time, drops empty entries and rejects duplicate day+time
   * combinations. Returns null when the list is invalid.
   */
  private normalizeServices(
    services: ChurchServiceDto[],
  ): ChurchServiceDto[] | null {
    const seen = new Set<string>();
    const normalized: ChurchServiceDto[] = [];

    for (const service of services) {
      const day = service.day?.trim();
      const time = service.time?.trim();

      if (!day || !time) {
        return null;
      }

      const key = `${day.toLowerCase()}|${time.toLowerCase()}`;

      if (seen.has(key)) {
        return null;
      }

      seen.add(key);
      normalized.push({ day, time });
    }

    return normalized;
  }
}
