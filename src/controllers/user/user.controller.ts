import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { Auth } from 'src/modules/auth/auth.decorator';
import { JWTPayload } from 'src/schemas/auth/JWTPayload';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserBusiness } from 'src/business/user/user.bl';
import { Users } from 'src/schemas/user/user.schema';
import {
  UserDTO,
  UpdateUserDTO,
  userEmailDTO,
} from 'src/schemas/user/user.DTO';
import { PaginatedResult } from 'src/dtos/pagination.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userBl: UserBusiness) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get all users',
    description:
      "Returns a paginated list of users filtered by the logged user's church. Supports search by name, last name or email, and pagination via page and limit query params.",
  })
  @ApiOkResponse({
    description: 'Paginated list of users',
    schema: {
      example: {
        data: [
          {
            _id: '679d017daf1fff94edac0c1a',
            name: 'Carlos',
            lastName: 'Mario',
            email: 'carlos@example.com',
            active: true,
            roles: [{ _id: '631ff3154ead3f03c943cfb1', name: 'Administrador' }],
          },
        ],
        metadata: { currentPage: 1, totalPages: 5, totalRecords: 50 },
      },
    },
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, last name or email',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (max 100)',
  })
  async getAllUsers(
    @Auth() user: JWTPayload,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResult<Users & { isMember: boolean }>> {
    return await this.userBl.getAllUsers(user.churchId, search, page, limit);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getUserById(@Param('id') id: string): Promise<Users> {
    return await this.userBl.getUserById(id);
  }

  @Post()
  async newUser(@Body() user: UserDTO): Promise<{ message: string }> {
    this.logger.log(
      `[newUser] Starting user registration for email: ${user.email}`,
    );
    try {
      await this.userBl.newUser(user);
      this.logger.log(`[newUser] User registered successfully: ${user.email}`);
      return {
        message:
          'Usuario registrado exitosamente. Su cuenta está pendiente de activación.',
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[newUser] Error creating user: ${err.message}`,
        err.stack,
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
  @UseGuards(AuthGuard)
  async updateUser(
    @Param('id') id: string,
    @Body() user: UpdateUserDTO,
  ): Promise<UpdateUserDTO> {
    return await this.userBl.updateUser(id, user);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<void> {
    return await this.userBl.deleteUser(id);
  }
}
