import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import { UserDTO } from 'src/schemas/user/user.DTO';
import { Users, UserDocument } from 'src/schemas/user/user.schema';

@Injectable()
export class UserProvider {
  constructor(
    @InjectModel(Users.name) private userModel: Model<UserDocument>,
  ) {}

  async getAllUsers() {
    return this.userModel.find();
  }

  async getUserById(id: string) {
    return this.userModel.findById(id).lean();
  }

  async getUserByEmail(email: string) {
    return this.userModel.findOne({ email }).select('-__v -confirmToken');
  }

  async newUser(user: UserDTO) {
    const confirmToken = nanoid(32);
    return this.userModel.create({
      ...user,
      confirmToken,
      workfront: null,
    });
  }

  async updateUser(id: string, user: UserDTO) {
    return this.userModel.updateOne(
      {
        _id: id,
      },
      user,
    );
  }

  /**
   * Updates user password securely
   * Uses findById + save() to trigger the pre-save hook in User schema
   * which automatically hashes the password before storing
   * @param userId - User's MongoDB ObjectId
   * @param newPassword - Plain text password (will be hashed by pre-save hook)
   * @returns Object indicating the number of documents modified
   * @throws Error if user not found
   */
  async updatePassword(userId: string, newPassword: string) {
    // Use findById + save to trigger pre-save hook that hashes the password
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();

    return { modifiedCount: 1 };
  }

  async deleteUser(id: string) {
    this.userModel.deleteOne({
      _id: id,
    });
  }
}
