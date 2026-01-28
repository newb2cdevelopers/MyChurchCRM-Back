import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { UserProvider } from 'src/providers/user/user.provider';
import { UserDTO } from 'src/schemas/user/user.DTO';
import { Users } from 'src/schemas/user/user.schema';

@Injectable()
export class UserBusiness {
  private readonly logger = new Logger(UserBusiness.name);

  constructor(private readonly provider: UserProvider) {}

  async getAllUsers(): Promise<Users[]> {
    return this.provider.getAllUsers() as unknown as Promise<Users[]>;
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
      this.logger.error(
        `[newUser] Error creating user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateUser(id: string, user: UserDTO): Promise<Users> {
    return this.provider.updateUser(id, user) as unknown as Promise<Users>;
  }

  async deleteUser(id: string): Promise<void> {
    this.provider.deleteUser(id);
  }
}
