import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { AuthBusiness } from 'src/business/auth/auth.bl';
import { LoginDTO, recoveryEmailDTO, recoveryEmailUpdateDTO } from 'src/schemas/auth/login.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';

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

  @Post('recoveryPassword')
  @ApiCreatedResponse({ description: 'Password Recovery update' })
  async updatePassword(@Body() newPasswordDto: recoveryEmailUpdateDTO,  @Query() query): Promise<GeneralResponse> {

    const token  =  query?.token_id;

    return  await this.authBusiness.checkTokenUser(newPasswordDto.newPassword, token);
  }

  @Post("generateTokenForRecovery")
  @ApiCreatedResponse({ description: 'Password Recovery request' })
  async recoverPassword(@Body() emailDto: recoveryEmailDTO): Promise<GeneralResponse> {
    return  await this.authBusiness.generateTokenForRecovery(emailDto.email);
  }
}
