import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  CreatePersonDto,
  PersonIdentityDto,
} from 'src/schemas/person/person.DTO';
import { PersonDocument } from 'src/schemas/person/person.schema';
import {
  normalizeDocument,
  normalizeEmail,
} from 'src/utils/normalization.util';
import { PersonProvider } from 'src/providers/person/person.provider';

@Injectable()
export class PersonBusiness {
  private readonly logger = new Logger(PersonBusiness.name);

  constructor(private readonly personProvider: PersonProvider) {}

  async resolveOrCreate(data: CreatePersonDto): Promise<PersonDocument> {
    const documentNumber = normalizeDocument(data.documentNumber);

    if (!documentNumber) {
      throw new Error('[resolveOrCreate] Document number is required');
    }

    const existing = await this.resolveMergedPerson(documentNumber);

    if (existing) {
      return existing;
    }

    const firstName = data.firstName.trim();
    const secondName = data.secondName?.trim();
    const firstLastName = data.firstLastName.trim();
    const secondLastName = data.secondLastName?.trim();

    const person = await this.personProvider.create({
      documentType: data.documentType,
      documentNumber,
      firstName,
      secondName: secondName || undefined,
      firstLastName,
      secondLastName: secondLastName || undefined,
      fullName: [firstName, secondName, firstLastName, secondLastName]
        .filter(Boolean)
        .join(' '),
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      email: data.email ? normalizeEmail(data.email) : undefined,
      mobilePhone: data.mobilePhone?.trim() || undefined,
      address: data.address?.trim() || undefined,
      createdByChurchId: data.createdByChurchId
        ? new Types.ObjectId(data.createdByChurchId)
        : undefined,
      status: 'active',
    });

    this.logger.log(`[resolveOrCreate] Created person ${person._id}`);

    return person;
  }

  async findIdentityByDocument(
    documentNumber: string,
  ): Promise<PersonIdentityDto | null> {
    const normalizedDocument = normalizeDocument(documentNumber);
    if (!normalizedDocument) {
      return null;
    }

    const person = await this.resolveMergedPerson(normalizedDocument);
    if (!person) {
      return null;
    }

    this.logger.log(
      `[findIdentityByDocument] Resolved identity for document ${normalizedDocument}`,
    );
    return {
      id: person._id.toString(),
      firstName: person.firstName,
      firstLastName: person.firstLastName,
      documentType: person.documentType,
      documentNumber: person.documentNumber,
    };
  }

  async merge(sourceId: string, targetId: string): Promise<PersonDocument> {
    if (
      !Types.ObjectId.isValid(sourceId) ||
      !Types.ObjectId.isValid(targetId) ||
      sourceId === targetId
    ) {
      throw new Error(
        '[merge] Source and target person IDs must be distinct ObjectIds',
      );
    }

    const source = await this.personProvider.findById(sourceId);
    const target = await this.personProvider.findById(targetId);
    if (!source || !target) {
      throw new Error('[merge] Source and target persons must exist');
    }
    if (target.status === 'merged') {
      throw new Error('[merge] Target person cannot already be merged');
    }

    const merged = await this.personProvider.updateMergedInto(
      source._id,
      target._id,
    );
    if (!merged) {
      throw new Error('[merge] Could not mark source person as merged');
    }

    this.logger.log(`[merge] Merged ${source._id} into ${target._id}`);
    return merged;
  }

  private async resolveMergedPerson(
    normalizedDocument: string,
  ): Promise<PersonDocument | null> {
    let person = await this.personProvider.findByDocumentNumber(
      normalizedDocument,
    );

    const visited = new Set<string>();

    while (person?.mergedInto) {
      const currentId = person._id.toString();

      if (visited.has(currentId)) {
        throw new Error(`[resolveMergedPerson] Merge cycle at ${currentId}`);
      }

      visited.add(currentId);

      person = await this.personProvider.findById(person.mergedInto);
    }

    return person;
  }
}
