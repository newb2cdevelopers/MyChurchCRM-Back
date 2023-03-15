import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { AuthBusiness } from 'src/business/auth/auth.bl';
import { LoginDTO } from 'src/schemas/auth/login.DTO';

@ApiTags('Auth')
@Controller('login')
export class AuthController {
  constructor(private readonly authBusiness: AuthBusiness) {}

  @Post()
  @ApiCreatedResponse({ description: 'Login client' })
  @ApiBody({ type: LoginDTO })
  async login(@Body() loginDTO: LoginDTO): Promise<{ access_token: string }> {
    const { user, pass } = loginDTO;
    const valid = await this.authBusiness.validateUser(user, pass);
    if (!valid) {
      return { access_token: null };
    }
    return await this.authBusiness.generateAccessToken(user);
  }
}
