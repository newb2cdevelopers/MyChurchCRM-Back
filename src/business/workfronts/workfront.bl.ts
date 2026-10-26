import { Injectable, Logger } from '@nestjs/common';
import { Workfront } from 'src/schemas/workfronts/workfront.schema';
import { WorkfrontProvider } from 'src/providers/workfront/workfront.provider';
import { UpdateWorkfrontDto } from 'src/schemas/workfronts/workfront.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';

@Injectable()
export class WorkfrontBusiness {
  private readonly logger = new Logger(WorkfrontBusiness.name);

  constructor(private readonly provider: WorkfrontProvider) {}

  async getAllWorkfronts(): Promise<Workfront[]> {
    return this.provider.getAllWorkfronts() as unknown as Promise<Workfront[]>;
  }

  async getAllWorkfrontsByChurch(churchId: string): Promise<Workfront[]> {
    return this.provider.getAllWorkfrontsByChurch(
      churchId,
    ) as unknown as Promise<Workfront[]>;
  }

  async getAllWorkfrontsByChurchAndModule(
    churchId: string,
    moduleId: string,
  ): Promise<Workfront[]> {
    return this.provider.getAllWorkfrontsByChurchAndModule(
      churchId,
      moduleId,
    ) as unknown as Promise<Workfront[]>;
  }

  async create(workfront: Workfront): Promise<Workfront> {
    return this.provider.create(workfront) as unknown as Promise<Workfront>;
  }

  async update(
    workfrontId: string,
    data: UpdateWorkfrontDto,
  ): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    const existing = await this.provider.getById(workfrontId);

    if (!existing) {
      response.message = 'El frente de trabajo no es válido';

      return response;
    }

    response.data = await this.provider.updateWorkfront(workfrontId, data);
    response.isSuccessful = true;
    response.message = 'Frente de trabajo actualizado correctamente';

    return response;
  }

  async remove(workfrontId: string): Promise<GeneralResponse> {
    const response: GeneralResponse = { isSuccessful: false };

    const existing = await this.provider.getById(workfrontId);

    if (!existing) {
      response.message = 'El frente de trabajo no es válido';

      return response;
    }

    await this.provider.unassignUsersFromWorkfront(workfrontId);
    response.data = await this.provider.deleteWorkfront(workfrontId);
    response.isSuccessful = true;
    response.message = 'Frente de trabajo eliminado correctamente';

    return response;
  }

  async getWorkFrontAssignmentData(churchId: string): Promise<GeneralResponse> {
    return this.provider.getWorkFrontAssignmentData(churchId);
  }

  async saveAssignment(
    workfrontId: string,
    users: string[],
  ): Promise<GeneralResponse> {
    return this.provider.saveAssignment(workfrontId, users);
  }
}
