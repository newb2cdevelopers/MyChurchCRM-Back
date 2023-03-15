import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UserDocument } from 'src/schemas/user/user.schema';
@Injectable()
export class AuthProvider {
  constructor(
    @InjectModel(Users.name) private userModel: Model<UserDocument>,
  ) {}

  async getUserByEmail(email: string, includeRelatedTables :boolean = false) {

    if (includeRelatedTables) {
      return this.userModel.findOne({ email }).populate(
        {
          path: "roles",
          model: 'Role',
          populate: {
            path: "Functionalities",
            model: "Functionality",
            populate: {
              path: "module",
              model: "Module",
            }
          }
        }
      ).select('-__v -confirmToken');
    }
    
    return this.userModel.findOne({ email }).select('-__v -confirmToken');
  }
}
