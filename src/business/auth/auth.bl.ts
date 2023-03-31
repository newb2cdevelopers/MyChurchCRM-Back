import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider } from 'src/providers/auth/auth.provider';
import { UserProvider } from 'src/providers/user/user.provider';
import { JWTPayload } from 'src/schemas/auth/JWTPayload';
import { Users } from 'src/schemas/user/user.schema';
import { key } from '../../modules/auth/constants';
import * as bcrypt from 'bcryptjs';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { sendEmail } from 'src/utilities/emailUtils';
@Injectable()
export class AuthBusiness {
  constructor(
    private readonly provider: AuthProvider,
    private readonly userProvider: UserProvider,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<boolean> {
    const user = (await this.provider.getUserByEmail(
      username,
    )) as unknown as Users;
    if (user && user.active) return user.comparePassword(pass);
    else return false;
  }

  async checkTokenUser(newPassword: string, token: string): Promise<GeneralResponse> {

    let response: GeneralResponse = { isSuccessful: true };

    try {
      const tokenInfo = this.jwtService.verify(token) as any;

      if (tokenInfo) {
    
        const salt = await bcrypt.genSalt(10);

        const hashedPassword = bcrypt.hashSync(newPassword, salt);
        
        await this.userProvider.updatePassword(tokenInfo.userId, hashedPassword )
        
        return response;
      }
      
    } catch (error) {
      console.log(error)
      response.isSuccessful = false;
      response.message = "Se ha presentado un error actualzando la contraseña";

      if (typeof(error) === "object" && Object.keys(error).includes("message") && error.message ) {

        if (error.message.includes("expired")) {
          response.message = "El link del correo ya no es válido, debe generar uno nuevo para continuar";
        }
      }
    }
   
    return response;
  }

  async generateTokenForRecovery(email: string): Promise<GeneralResponse> {

    let response: GeneralResponse = { isSuccessful: true, message: "Email enviado, por favor revise su correo" };

    const user = (await this.provider.getUserByEmail(email, false)) as unknown as Users;

    if (user) {
      const payload: JWTPayload = { userId: user._id.toString() };

      const token =  this.jwtService.sign(payload, {
        expiresIn: "10m",
        privateKey: key
      });
      
      const emailBody = `Por favor ingrese al siguiente link para reestablecer su contraseña <strong><a style="color:blue; cursor:pointer" href="${process.env.APP_URL_BASE}/recoveryPassword?token_id=${token}">Reestablecer contraseña aquí</a></strong>`

      try {
        const emailResponse = await sendEmail(email, "Cambio de contraseña", emailBody )
        if (!emailResponse) {
          response.isSuccessful = false,
          response.message = "No se pudo enviar el correo"
        }

      } catch (error) {
        console.log(error)
        response.isSuccessful = false,
        response.message = "No se pudo enviar el correo"
      }

      return response
    }
   
    response.isSuccessful = false;
    response.message = "El correo no es válido"

    return response;

  }

  async generateAccessToken(name: string) {
    const user = (await this.provider.getUserByEmail(name, true)) as unknown as Users;
    const payload: JWTPayload = { userId: user.email };

    return {
      access_token: this.jwtService.sign(payload),
      churchId: user.churchId,
      roles: this.generateDashboardInfo(user.roles)
    };
  }

  generateDashboardInfo(roles: any) {

    let functionalities = [] as any;

    roles?.forEach(role => {   
      functionalities =  functionalities.concat(role.Functionalities)
    });

    const groupByModule = functionalities.reduce((group, functionality) => {
      const { module } = functionality;
      group[module.name] = group[module.name] ?? [];
      group[module.name].push(functionality);
      return group;
    }, {});

    const groupArray = Object.entries(groupByModule);

    const rolesArray = [];

    groupArray.forEach(([key, value]) => {
      
      rolesArray.push({
        module: key,
        accesses: value
      });

    });

    return rolesArray;
  }
}
