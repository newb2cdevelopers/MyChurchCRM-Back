import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UserDocument } from 'src/schemas/user/user.schema';
import { PersonProvider } from 'src/providers/person/person.provider';

@Injectable()
export class AuthProvider {
  constructor(
    @InjectModel(Users.name) private userModel: Model<UserDocument>,
    private readonly personProvider: PersonProvider,
  ) {}

  async getUserByEmailOrDocument(
    identifier: string,
    includeRelatedTables = false,
  ) {
    const isEmail = identifier.includes('@');
    let filter: { email: string } | { personId: unknown };

    if (isEmail) {
      filter = { email: identifier.toLowerCase().trim() };
    } else {
      // Document number is identity data owned by Person.
      // Resolve the canonical person first, then the account linked by personId.
      const person = await this.personProvider.findByDocumentNumber(identifier);

      if (!person) {
        return null;
      }

      filter = { personId: person._id };
    }

    const query = this.userModel.findOne(filter);

    query.populate({ path: 'personId', model: 'Person' });

    if (includeRelatedTables) {
      query.populate({
        path: 'roles',
        model: 'Role',
      });
    }

    return query.select('-__v -confirmToken');
  }

  async getUserByEmail(email: string, includeRelatedTables = false) {
    if (includeRelatedTables) {
      return this.userModel
        .findOne({ email })
        .populate({
          path: 'roles',
          model: 'Role',
        })
        .select('-__v -confirmToken');
    }

    return this.userModel.findOne({ email }).select('-__v -confirmToken');
  }

  async getUserById(id: string, includeRelatedTables = false) {
    if (includeRelatedTables) {
      return this.userModel
        .findById(id)
        .populate({ path: 'personId', model: 'Person' })
        .populate({
          path: 'roles',
          model: 'Role',
        })
        .select('-__v -confirmToken');
    }

    return this.userModel
      .findById(id)
      .populate({ path: 'personId', model: 'Person' })
      .select('-__v -confirmToken');
  }
}
