import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JWTPayload } from 'src/schemas/auth/JWTPayload';

export const Auth = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Partial<JWTPayload> => {
    try {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    } catch (error) {
      throw new ForbiddenException();
    }
  },
);
