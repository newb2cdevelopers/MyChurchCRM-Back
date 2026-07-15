import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { UserProvider } from 'src/providers/user/user.provider';
import { UserDTO, UpdateUserDTO } from 'src/schemas/user/user.DTO';
import { Users, UserDocument } from 'src/schemas/user/user.schema';
import { PaginatedResult } from 'src/dtos/pagination.dto';

@Injectable()
export class UserBusiness {
  private readonly logger = new Logger(UserBusiness.name);

  constructor(private readonly provider: UserProvider) {}

  async getAllUsers(
    churchId?: string,
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Users>> {
    const filter: FilterQuery<UserDocument> = {};
    if (churchId) {
      filter.churchId = churchId;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { lastName: regex }, { email: regex }];
    }

    return this.provider.getAllUsers(filter, page, limit);
  }

  async getUserById(id: string): Promise<Users> {
    return this.provider.getUserById(id) as unknown as Promise<Users>;
  }

  async getUserByEmail(email: string) {
    return this.provider.getUserByEmail(email) as unknown as Promise<Users>;
  }

  async userExistByEmail(email: string) {
    const user = await this.provider.getUserByEmail(email);
    return user !== null;
  }

  async newUser(user: UserDTO): Promise<Users> {
    this.logger.log(
      `[newUser] Checking if user exists with email: ${user.email}`,
    );
    const userExist = await this.provider.getUserByEmail(user.email);

    if (userExist) {
      this.logger.warn(
        `[newUser] User already exists with email: ${user.email}`,
      );
      throw new ConflictException('Email is already registered in the system');
    }

    this.logger.log(`[newUser] Creating new user with email: ${user.email}`);
    try {
      const newUser = await this.provider.newUser(user);
      this.logger.log(
        `[newUser] User created successfully with ID: ${newUser._id}`,
      );
      return newUser as unknown as Promise<Users>;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[newUser] Error creating user: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  async updateUser(id: string, user: UpdateUserDTO): Promise<Users> {
    this.logger.log(`[updateUser] Updating user with ID: ${id}`);
    return this.provider.updateUser(id, user) as unknown as Promise<Users>;
  }

  async deleteUser(id: string): Promise<void> {
    this.logger.log(`[deleteUser] Deleting user with ID: ${id}`);
    this.provider.deleteUser(id);
  }
}
