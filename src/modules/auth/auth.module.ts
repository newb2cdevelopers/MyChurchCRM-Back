import { Module } from '@nestjs/common';
import { AuthBusiness } from 'src/business/auth/auth.bl';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from 'src/controllers/auth/auth.controller';
import { AuthProvider } from 'src/providers/auth/auth.provider';
import { Users, UserSchema } from 'src/schemas/user/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './JwtStrategy';
import { key } from './constants';
import { GoogleStrategy } from './googleStrategy';
import { AuthGoogleController } from 'src/controllers/auth/auth.google.controller';
import { AuthGoogleBusiness } from 'src/business/auth/google.auth.bl';
import { UserProvider } from 'src/providers/user/user.provider';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.register({
      secret: key,
      signOptions: { expiresIn: '3h' },
    }),
  ],
  controllers: [AuthController, AuthGoogleController],
  providers: [
    AuthBusiness,
    AuthGoogleBusiness,
    AuthProvider,
    UserProvider,
    JwtStrategy,
    GoogleStrategy,
  ],
})
export class AuthModule {}
