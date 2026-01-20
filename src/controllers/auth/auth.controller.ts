import { Body, Controller, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { AuthBusiness } from 'src/business/auth/auth.bl';
import {
  LoginDTO,
  recoveryEmailDTO,
  recoveryEmailUpdateDTO,
} from 'src/schemas/auth/login.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';

@ApiTags('Auth')
@Controller('login')
export class AuthController {
  constructor(private readonly authBusiness: AuthBusiness) {}

  @Post()
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password',
  })
  @ApiCreatedResponse({
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        churchId: '507f1f77bcf86cd799439011',
        roles: [],
        workfront: null,
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: LoginDTO })
  async login(@Body() loginDTO: LoginDTO): Promise<{ access_token: string }> {
    const { user, pass } = loginDTO;
    const valid = await this.authBusiness.validateUser(user, pass);
    if (!valid) {
      return { access_token: null };
    }
    return await this.authBusiness.generateAccessToken(user);
  }

  @Post('recoveryPassword')
  @ApiOperation({
    summary: 'Update password with recovery token',
    description:
      'Updates user password using the token received via email. Token expires in 10 minutes.',
  })
  @ApiQuery({
    name: 'token_id',
    required: true,
    description: 'JWT token received in recovery email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiCreatedResponse({
    description: 'Password updated successfully',
    schema: {
      example: {
        isSuccessful: true,
        message: 'Password updated successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired token',
    schema: {
      example: {
        isSuccessful: false,
        message: 'The recovery link has expired, please request a new one',
      },
    },
  })
  @ApiBody({ type: recoveryEmailUpdateDTO })
  async updatePassword(
    @Body() newPasswordDto: recoveryEmailUpdateDTO,
    @Query('token_id') tokenId: string,
  ): Promise<GeneralResponse> {
    return await this.authBusiness.checkTokenUser(
      newPasswordDto.newPassword,
      tokenId,
    );
  }

  @Post('generateTokenForRecovery')
  @ApiOperation({
    summary: 'Request password recovery',
    description:
      'Sends a password recovery email with a token that expires in 10 minutes',
  })
  @ApiCreatedResponse({
    description: 'Recovery email sent successfully',
    schema: {
      example: {
        isSuccessful: true,
        message: 'Recovery email sent successfully, please check your inbox',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Email not found',
    schema: {
      example: {
        isSuccessful: false,
        message: 'Email not found in our system',
      },
    },
  })
  @ApiBody({ type: recoveryEmailDTO })
  async recoverPassword(
    @Body() emailDto: recoveryEmailDTO,
  ): Promise<GeneralResponse> {
    return await this.authBusiness.generateTokenForRecovery(emailDto.email);
  }
}
