import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthProvider } from 'src/providers/auth/auth.provider';
import { JWTPayload } from 'src/schemas/auth/JWTPayload';
import { Users } from 'src/schemas/user/user.schema';
import { key } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private provider: AuthProvider) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: key,
    });
  }

  async validate(payload: JWTPayload): Promise<Users> {
    const user = (await this.provider.getUserByEmail(
      payload.userId,
    )) as unknown as Users;
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
