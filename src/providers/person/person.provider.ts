import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Person, PersonDocument } from 'src/schemas/person/person.schema';

@Injectable()
export class PersonProvider {
  constructor(
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
  ) {}

  async findByDocumentNumber(
    documentNumber: string,
  ): Promise<PersonDocument | null> {
    return this.personModel.findOne({ documentNumber }).exec();
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
}
