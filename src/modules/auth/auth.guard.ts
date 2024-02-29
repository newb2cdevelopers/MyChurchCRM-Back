import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { key } from './constants';
import { Request } from 'express';
import { AuthProvider } from 'src/providers/auth/auth.provider';
import { Users } from 'src/schemas/user/user.schema';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private provider: AuthProvider) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: key
        }
      );

      const user = (await this.provider.getUserByEmail(
        payload.userId,
      )) as unknown as Users;

      if (!user) {
        throw new UnauthorizedException();
      }

      request['user'] = user;
    } catch {
      throw new UnauthorizedException();
    }
    
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}