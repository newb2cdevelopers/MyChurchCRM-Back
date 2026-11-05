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

  /**
   * Returns the ids of persons whose name fields match the search term.
   * Used to resolve user/member searches that used to rely on duplicated
   * identity fields stored in the profile collections.
   */
  async findIdsByName(search: string): Promise<Types.ObjectId[]> {
    if (!search) return [];

    const regex = new RegExp(search, 'i');

    const persons = await this.personModel
      .find({
        $or: [
          { firstName: regex },
          { secondName: regex },
          { firstLastName: regex },
          { secondLastName: regex },
          { fullName: regex },
        ],
      })
      .select('_id')
      .lean();

    return persons.map((person) => person._id);
  }

  async create(data: Partial<Person>): Promise<PersonDocument> {
    return this.personModel.create(data);
  }

  /**
   * Returns the ids of persons matching the term in any name field or in the
   * document number. Used by profile searches after identity was centralized.
   */
  async findIdsBySearch(search: string): Promise<Types.ObjectId[]> {
    if (!search) return [];

    const regex = new RegExp(search, 'i');

    const persons = await this.personModel
      .find({
        $or: [
          { firstName: regex },
          { secondName: regex },
          { firstLastName: regex },
          { secondLastName: regex },
          { fullName: regex },
          { documentNumber: regex },
        ],
      })
      .select('_id')
      .lean();

    return persons.map((person) => person._id);
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
    if (personData.documentType) update.documentType = personData.documentType;
    if (personData.secondName) update.secondName = personData.secondName;
    if (personData.firstLastName)
      update.firstLastName = personData.firstLastName;
    if (personData.secondLastName)
      update.secondLastName = personData.secondLastName;
    if (personData.email) update.email = normalizeEmail(personData.email);
    if (personData.mobilePhone) update.mobilePhone = personData.mobilePhone;
    if (personData.landLine) update.landLine = personData.landLine;
    if (personData.address) update.address = personData.address;
    if (personData.housingType) update.housingType = personData.housingType;
    if (personData.maritalStatus)
      update.maritalStatus = personData.maritalStatus;
    if (personData.educationalLevel)
      update.educationalLevel = personData.educationalLevel;
    if (personData.occupation) update.occupation = personData.occupation;
    if (personData.birthDate) {
      update.birthDate =
        personData.birthDate instanceof Date
          ? personData.birthDate
          : new Date(personData.birthDate);
    }

    if (Object.keys(update).length === 0) {
      return this.personModel.findById(id).exec();
    }

    const existingPerson = await this.personModel.findById(id).exec();

    if (!existingPerson) {
      return null;
    }

    // Merge with the stored name fields so partial updates never erase the
    // derived fullName (for example when only the phone number changes).
    const firstName = update.firstName ?? existingPerson.firstName ?? '';
    const secondName = update.secondName ?? existingPerson.secondName ?? '';
    const firstLastName =
      update.firstLastName ?? existingPerson.firstLastName ?? '';
    const secondLastName =
      update.secondLastName ?? existingPerson.secondLastName ?? '';
    update.fullName = [firstName, secondName, firstLastName, secondLastName]
      .filter(Boolean)
      .join(' ');

    return this.personModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .exec();
  }
}
