import { Injectable } from '@nestjs/common';
import { Attendee } from 'src/schemas/attendee/attendee.schema';
import { AttendeeProvider } from 'src/providers/attendee/attendee.provider';
import { AttendeeDTO } from 'src/schemas/attendee/attendee.DTO';
import { BulkLoadResponse } from 'src/dtos/BulkLoadResponse';

@Injectable()
export class AttendeeBusiness {
  constructor(private readonly provider: AttendeeProvider) {}

  async getAllAttendee(): Promise<Attendee[]> {
    return this.provider.getAllAttendee() as unknown as Promise<Attendee[]>;
  }

  async getAllAttendeeByDocumentNumber(
    documentNumber: string,
  ): Promise<Attendee> {
    return this.provider.getAllAttendeeByDocumentNumber(
      documentNumber,
    ) as unknown as Promise<Attendee>;
  }

  async create(attendee: AttendeeDTO): Promise<Attendee> {
    return this.provider.create(attendee) as unknown as Promise<Attendee>;
  }

  async update(atendeeId: string, attendee: AttendeeDTO): Promise<boolean> {
    return this.provider.update(atendeeId, attendee) as unknown as Promise<boolean>;
  }

  async createCollection(
    attendees: AttendeeDTO[],
  ): Promise<BulkLoadResponse[]> {
    return this.provider.createCollection(attendees) as unknown as Promise<
      BulkLoadResponse[]
    >;
  }
}
