import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UserDocument } from 'src/schemas/user/user.schema';
@Injectable()
export class AuthProvider {
  constructor(
    @InjectModel(Users.name) private userModel: Model<UserDocument>,
  ) {}

  async getUserByEmailOrDocument(
    identifier: string,
    includeRelatedTables = false,
  ) {
    const isEmail = identifier.includes('@');

    const filter = isEmail
      ? { email: identifier.toLowerCase() }
      : { documentNumber: identifier };

    const query = this.userModel.findOne(filter);

    if (includeRelatedTables) {
      query.populate({
        path: 'roles',
        model: 'Role',
        populate: {
          path: 'Functionalities',
          model: 'Functionality',
          populate: {
            path: 'module',
            model: 'Module',
          },
        },
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
          populate: {
            path: 'Functionalities',
            model: 'Functionality',
            populate: {
              path: 'module',
              model: 'Module',
            },
          },
        })
        .select('-__v -confirmToken');
    }

    return this.userModel.findOne({ email }).select('-__v -confirmToken');
  }

  async getUserById(id: string, includeRelatedTables = false) {
    if (includeRelatedTables) {
      return this.userModel
        .findById(id)
        .populate({
          path: 'roles',
          model: 'Role',
          populate: {
            path: 'Functionalities',
            model: 'Functionality',
            populate: {
              path: 'module',
              model: 'Module',
            },
          },
        })
        .select('-__v -confirmToken');
    }

    return this.userModel.findById(id).select('-__v -confirmToken');
  }
}
