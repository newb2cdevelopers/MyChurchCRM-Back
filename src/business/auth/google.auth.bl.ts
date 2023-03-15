import { Injectable } from '@nestjs/common';
import { UserProvider } from 'src/providers/user/user.provider';
import { GoogleResponseDTO } from 'src/schemas/auth/googleResponse.DTO';
import { AuthBusiness } from './auth.bl';

@Injectable()
export class AuthGoogleBusiness {
  constructor(
    private readonly userProvider: UserProvider,
    private readonly authBusiness: AuthBusiness,
  ) {}
  async googleLogin(req: any): Promise<GoogleResponseDTO> {
    const response = new GoogleResponseDTO();
    if (!req.user) {
      return response;
    }
    const { email } = req.user;
    const user = await this.userProvider.getUserByEmail(email);
    response.success = true;
    if (user) {
      response.existingUser = true;
      response.token = (
        await this.authBusiness.generateAccessToken(email)
      ).access_token;
    } else {
      response.user = req.user;
    }

    return response;
  }
}
