import { Body, Controller, Post, Query, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthBusiness } from 'src/business/auth/auth.bl';
import {
  LoginDTO,
  recoveryEmailDTO,
  recoveryEmailUpdateDTO,
  RefreshTokenDTO,
} from 'src/schemas/auth/login.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';

@ApiTags('Auth')
@Controller('login')
export class AuthController {
  constructor(private readonly authBusiness: AuthBusiness) {}

  @Post()
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password.',
  })
  @ApiCreatedResponse({
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'a1b2c3d4e5f6g7h8i9j0...',
        churchId: '507f1f77bcf86cd799439011',
        roles: [],
        workfront: null,
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: LoginDTO })
  async login(
    @Body() loginDTO: LoginDTO,
    @Req() request: Request,
  ): Promise<{
    access_token: string;
    refresh_token?: string;
    churchId?: string;
    roles?: any[];
    workfront?: any;
  }> {
    const { user, pass } = loginDTO;
    const valid = await this.authBusiness.validateUser(user, pass);
    if (!valid) {
      return { access_token: null };
    }

    // Extract IP address and user agent for auditing
    const ipAddress = request.ip || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return await this.authBusiness.generateAccessToken(
      user,
      ipAddress,
      userAgent,
    );
  }

  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Generates a new access token using a valid refresh token. Access token expires in 1 hour.',
  })
  @ApiCreatedResponse({
    description: 'Token refreshed successfully',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        churchId: '507f1f77bcf86cd799439011',
        roles: [],
        workfront: null,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid, expired, or revoked refresh token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid refresh token',
        error: 'Unauthorized',
      },
    },
  })
  @ApiBody({ type: RefreshTokenDTO })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDTO) {
    return await this.authBusiness.refreshAccessToken(
      refreshTokenDto.refresh_token,
    );
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout (revoke refresh token)',
    description:
      'Revokes the refresh token, effectively logging out the user from the current device',
  })
  @ApiCreatedResponse({
    description: 'Logout successful',
    schema: {
      example: {
        isSuccessful: true,
        message: 'Logout successful',
      },
    },
  })
  @ApiBody({ type: RefreshTokenDTO })
  async logout(
    @Body() refreshTokenDto: RefreshTokenDTO,
  ): Promise<GeneralResponse> {
    return await this.authBusiness.revokeRefreshToken(
      refreshTokenDto.refresh_token,
    );
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
