import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { UserProvider } from 'src/providers/user/user.provider';
import { MemberProvider } from 'src/providers/members/member.provider';
import { UserDTO, UpdateUserDTO } from 'src/schemas/user/user.DTO';
import { Users, UserDocument } from 'src/schemas/user/user.schema';
import { PaginatedResult } from 'src/dtos/pagination.dto';

@Injectable()
export class UserBusiness {
  private readonly logger = new Logger(UserBusiness.name);

  constructor(
    private readonly userProvider: UserProvider,
    private readonly memberProvider: MemberProvider,
  ) {}

  async getAllUsers(
    churchId?: string,
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Users & { isMember: boolean }>> {
    const filter: FilterQuery<UserDocument> = {};
    if (churchId) {
      filter.churchId = churchId;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { lastName: regex }, { email: regex }];
    }

    const result = await this.userProvider.getAllUsers(filter, page, limit);

    const emails = result.data.map((u) => u.email).filter(Boolean);
    let memberEmails = new Set<string>();
    if (emails.length > 0) {
      const members = await this.memberProvider.findByEmails(emails);
      memberEmails = new Set(members.map((m) => m.email));
    }

    const data = result.data.map((u) => ({
      ...u,
      isMember: memberEmails.has(u.email),
    }));

    return { data, metadata: result.metadata };
  }

  async getUserById(id: string): Promise<Users> {
    return this.userProvider.getUserById(id) as unknown as Promise<Users>;
  }

  async getUserByEmail(email: string) {
    return this.userProvider.getUserByEmail(email) as unknown as Promise<Users>;
  }

  async userExistByEmail(email: string) {
    const user = await this.userProvider.getUserByEmail(email);
    return user !== null;
  }

  async newUser(user: UserDTO): Promise<Users> {
    this.logger.log(
      `[newUser] Checking if user exists with email: ${user.email}`,
    );
    const userExist = await this.userProvider.getUserByEmail(user.email);

    if (userExist) {
      this.logger.warn(
        `[newUser] User already exists with email: ${user.email}`,
      );
      throw new ConflictException('Email is already registered in the system');
    }

    this.logger.log(`[newUser] Creating new user with email: ${user.email}`);

    try {
      const newUser = await this.userProvider.newUser(user);
      this.logger.log(
        `[newUser] User created successfully with ID: ${newUser._id}`,
      );

      // Link user to member if exists
      const member = await this.memberProvider.findByDocument(
        user.documentType,
        user.documentNumber,
      );

      if (member) {
        await this.userProvider.updateUser(newUser._id, {
          memberId: String(member._id),
        } as UpdateUserDTO);

        this.logger.log(
          `[newUser] Linked user ${newUser._id} to member ${member._id}`,
        );
      }

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
    return this.userProvider.updateUser(id, user) as unknown as Promise<Users>;
  }

  async deleteUser(id: string): Promise<void> {
    this.logger.log(`[deleteUser] Deleting user with ID: ${id}`);
    this.userProvider.deleteUser(id);
  }
}
