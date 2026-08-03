import { Module, Global } from '@nestjs/common';
import { AuthBusiness } from 'src/business/auth/auth.bl';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from 'src/controllers/auth/auth.controller';
import { AuthProvider } from 'src/providers/auth/auth.provider';
import { RefreshTokenProvider } from 'src/providers/auth/refreshToken.provider';
import { Users, UserSchema } from 'src/schemas/user/user.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from 'src/schemas/auth/refreshToken.schema';
import { Church, ChurchSchema } from 'src/schemas/churches/church.schema';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './JwtStrategy';
import { key } from './constants';
import { GoogleStrategy } from './googleStrategy';
import { PermissionGuard } from './permission.guard';
import { AuthGoogleController } from 'src/controllers/auth/auth.google.controller';
import { AuthGoogleBusiness } from 'src/business/auth/google.auth.bl';
import { UserProvider } from 'src/providers/user/user.provider';
import { RolePermissionModule } from 'src/modules/role-permission/role-permission.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Users.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: Church.name, schema: ChurchSchema },
    ]),
    PassportModule,
    JwtModule.register({
      secret: key,
      signOptions: { expiresIn: '1h' }, // Changed from 3h to 1h
    }),
    RolePermissionModule,
  ],
  controllers: [AuthController, AuthGoogleController],
  providers: [
    AuthBusiness,
    AuthGoogleBusiness,
    AuthProvider,
    RefreshTokenProvider,
    UserProvider,
    JwtStrategy,
    GoogleStrategy,
    PermissionGuard,
  ],
  exports: [
    AuthProvider,
    AuthBusiness,
    RefreshTokenProvider,
    JwtModule,
    UserProvider,
  ],
})
export class AuthModule {}
