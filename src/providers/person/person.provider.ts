import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Person, PersonDocument } from 'src/schemas/person/person.schema';
import { CreatePersonDto } from 'src/schemas/person/person.DTO';
import {
  normalizeDocument,
  normalizeEmail,
} from 'src/utils/normalization.util';

@Injectable()
export class PersonProvider {
  private readonly logger = new Logger(PersonProvider.name);

  constructor(
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
  ) {}

  async findByDocumentNumber(
    documentNumber: string,
  ): Promise<PersonDocument | null> {
    const normalizedDoc = normalizeDocument(documentNumber);

    if (!normalizedDoc) return null;

    const person = await this.personModel
      .findOne({ documentNumber: normalizedDoc })
      .exec();

    if (!person) return null;

    if (person.status === 'merged' && person.mergedInto) {
      return this.personModel.findById(person.mergedInto).exec();
    }

    return person;
  }

  async findById(id: string | Types.ObjectId): Promise<PersonDocument | null> {
    return this.personModel.findById(id).exec();
  }

  async create(data: Partial<Person>): Promise<PersonDocument> {
    return this.personModel.create(data);
  }

  async updateMergedInto(
    id: string | Types.ObjectId,
    mergedInto: Types.ObjectId,
  ): Promise<PersonDocument | null> {
    return this.personModel
      .findByIdAndUpdate(
        id,
        { $set: { mergedInto, status: 'merged' } },
        { new: true },
      )
      .exec();
  }

  async resolveOrCreate(data: CreatePersonDto): Promise<PersonDocument> {
    const normalizedDoc = normalizeDocument(data.documentNumber);

    if (!normalizedDoc) {
      throw new Error(
        'Document number is required to resolve or create a person',
      );
    }

    let person = await this.findByDocumentNumber(normalizedDoc);

    if (person) {
      return person;
    }

    const firstName = data.firstName?.trim() || '';
    const secondName = data.secondName?.trim() || '';
    const firstLastName = data.firstLastName?.trim() || '';
    const secondLastName = data.secondLastName?.trim() || '';
    const fullName = [firstName, secondName, firstLastName, secondLastName]
      .filter(Boolean)
      .join(' ');

    const newPersonData = {
      documentType: data.documentType,
      documentNumber: normalizedDoc,
      firstName,
      secondName: secondName || undefined,
      firstLastName,
      secondLastName: secondLastName || undefined,
      fullName,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      email: data.email ? normalizeEmail(data.email) : undefined,
      mobilePhone: data.mobilePhone?.trim() || undefined,
      address: data.address?.trim() || undefined,
      createdByChurchId: data.createdByChurchId
        ? data.createdByChurchId
        : undefined,
      status: 'active',
    };

    person = await this.personModel.create(newPersonData);
    this.logger.log(
      `[resolveOrCreate] Created canonical person ${person._id} for doc ${normalizedDoc}`,
    );

    return person;
  }

  // Updates basic data of the canonical person (exclusive use from activation/administration)
  async updateBasicInfo(
    id: string | Types.ObjectId,
    data: Partial<Person>,
  ): Promise<PersonDocument | null> {
    const personData = data as Partial<Person> & {
      secondName?: string;
      secondLastName?: string;
      mobilePhone?: string;
      address?: string;
      birthDate?: string | Date;
    };

    const update: Partial<Person> & {
      secondName?: string;
      secondLastName?: string;
      mobilePhone?: string;
      address?: string;
      birthDate?: Date;
      fullName?: string;
    } = {};

    if (personData.firstName) update.firstName = personData.firstName;
    if (personData.secondName) update.secondName = personData.secondName;
    if (personData.firstLastName)
      update.firstLastName = personData.firstLastName;
    if (personData.secondLastName)
      update.secondLastName = personData.secondLastName;
    if (personData.email) update.email = normalizeEmail(personData.email);
    if (personData.mobilePhone) update.mobilePhone = personData.mobilePhone;
    if (personData.address) update.address = personData.address;
    if (personData.birthDate) {
      update.birthDate =
        personData.birthDate instanceof Date
          ? personData.birthDate
          : new Date(personData.birthDate);
    }

    if (Object.keys(update).length === 0) {
      return this.personModel.findById(id).exec();
    }

    const firstName = update.firstName || personData.firstName || '';
    const secondName = update.secondName || personData.secondName || '';
    const firstLastName =
      update.firstLastName || personData.firstLastName || '';
    const secondLastName =
      update.secondLastName || personData.secondLastName || '';
    update.fullName = [firstName, secondName, firstLastName, secondLastName]
      .filter(Boolean)
      .join(' ');

    return this.personModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .exec();
  }
}
