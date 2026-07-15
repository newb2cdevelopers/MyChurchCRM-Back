import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { nanoid } from 'nanoid';
import { UserDTO, UpdateUserDTO } from 'src/schemas/user/user.DTO';
import { Users, UserDocument } from 'src/schemas/user/user.schema';
import { PaginatedResult, calculatePagination } from 'src/dtos/pagination.dto';

@Injectable()
export class UserProvider {
  constructor(
    @InjectModel(Users.name) private userModel: Model<UserDocument>,
  ) {}

  async getAllUsers(
    filter: FilterQuery<UserDocument>,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Users>> {
    const { skip } = calculatePagination({ page, limit });

    const [data, totalRecords] = await Promise.all([
      this.userModel
        .find(filter)
        .skip(skip)
        .limit(limit || 10)
        .select('-password -__v -confirmToken')
        .populate('roles'),
      this.userModel.countDocuments(filter),
    ]);

    const { page: currentPage, limit: pageSize } = calculatePagination({
      page,
      limit,
    });
    const totalPages = Math.ceil(totalRecords / pageSize);

    return { data, metadata: { currentPage, totalPages, totalRecords } };
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

  async updateUser(id: string, user: UpdateUserDTO) {
    return this.userModel.updateOne({ _id: id }, user);
  }

  async updatePassword(userId: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();

    return { modifiedCount: 1 };
  }

  async deleteUser(id: string) {
    this.userModel.deleteOne({ _id: id });
  }
}
