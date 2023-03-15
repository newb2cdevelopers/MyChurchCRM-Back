import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiCreatedResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGoogleBusiness } from 'src/business/auth/google.auth.bl';
import { GoogleResponseDTO } from 'src/schemas/auth/googleResponse.DTO';

@ApiTags('Auth')
@Controller('google')
export class AuthGoogleController {
  constructor(private readonly authBusiness: AuthGoogleBusiness) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async googleAuth(@Req() req) {}

  @Get('redirect')
  @ApiCreatedResponse({ description: 'Login with google' })
  @UseGuards(AuthGuard('google'))
  @ApiResponse({ type: GoogleResponseDTO })
  async googleLogin(@Req() req) {
    return this.authBusiness.googleLogin(req);
  }
}
