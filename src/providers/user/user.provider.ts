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
        .sort({ createdAt: -1 })
        .lean()
        .skip(skip)
        .limit(limit || 10)
        .select('-password -__v -confirmToken')
        .populate('roles')
        .populate('zoneId'),
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

  // Gets user with the canonical token to compare snapshot vs person
  async getUserByIdWithPerson(id: string, churchId: string) {
    return this.userModel
      .findOne({ _id: id, churchId })
      .populate({ path: 'personId', model: 'Person' })
      .select('-__v -confirmToken')
      .lean();
  }

  async getUserByEmail(email: string) {
    if (!email) return null;

    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('-__v -confirmToken');
  }

  async getUserByPersonId(personId: string) {
    if (!personId) return null;
    return this.userModel.findOne({ personId }).select('-__v -confirmToken');
  }

  async newUser(user: UserDTO) {
    const confirmToken = nanoid(32);

    const userToCreate = {
      ...user,
      email: user.email?.toLowerCase().trim(),
    };

    return this.userModel.create({
      ...userToCreate,
      confirmToken,
      workfront: null,
    });
  }

  async updateUser(id: string, user: UpdateUserDTO) {
    return this.userModel.updateOne({ _id: id }, user);
  }

  // Activate the account, mark it as active and clean the registry snapshot
  async activateUser(id: string) {
    return this.userModel.updateOne(
      { _id: id },
      {
        $set: { status: 'active', active: true },
        $unset: { registrationSnapshot: 1, rejectedAt: 1, rejectedReason: 1 },
      },
    );
  }

  // Decline account registration
  async rejectUser(id: string, reason?: string) {
    return this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          status: 'rejected',
          active: false,
          rejectedAt: new Date(),
          rejectedReason: reason || null,
        },
        $unset: { registrationSnapshot: 1 },
      },
    );
  }

  async updateUserStatus(
    id: string,
    data: Partial<UserDTO> & { status?: string; active?: boolean },
  ) {
    return this.userModel.updateOne({ _id: id }, { $set: data });
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
