import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserBusiness } from 'src/business/user/user.bl';
import { Users } from 'src/schemas/user/user.schema';
import { UserDTO, userEmailDTO } from 'src/schemas/user/user.DTO';
import { AuthBusiness } from 'src/business/auth/auth.bl';
import { AuthTokenResponse } from 'src/interfaces/auth.interfaces';

@ApiTags('User')
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userBl: UserBusiness,
    private readonly authBusiness: AuthBusiness,
  ) {}

  @Get()
  async getAllUsers(): Promise<Users[]> {
    return await this.userBl.getAllUsers();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getUserById(@Param('id') id: string): Promise<Users> {
    return await this.userBl.getUserById(id);
  }

  @Post()
  async newUser(
    @Body() user: UserDTO,
    @Req() request: Request,
  ): Promise<AuthTokenResponse> {
    this.logger.log(
      `[newUser] Starting user registration for email: ${user.email}`,
    );
    try {
      // Create the user
      const result = await this.userBl.newUser(user);
      this.logger.log(
        `[newUser] User registered successfully with ID: ${result._id}`,
      );

      // Generate tokens for auto-login (same as login endpoint)
      const ipAddress = request.ip || request.socket.remoteAddress;
      const userAgent = request.headers['user-agent'];

      this.logger.log(
        `[newUser] Generating tokens for auto-login: ${user.email}`,
      );
      const tokens = await this.authBusiness.generateAccessToken(
        user.email,
        ipAddress,
        userAgent,
      );

      this.logger.log(
        `[newUser] User registered and logged in successfully: ${user.email}`,
      );
      return tokens;
    } catch (error) {
      this.logger.error(
        `[newUser] Error registering user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('userExist')
  async userExistByEmail(@Body() user: userEmailDTO): Promise<boolean> {
    return await this.userBl.userExistByEmail(user.email);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async updateUser(
    @Param('id') id: string,
    @Body() user: UserDTO,
  ): Promise<UserDTO> {
    return await this.userBl.updateUser(id, user);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<void> {
    return await this.userBl.deleteUser(id);
  }
}
