import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Users, UserSchema } from 'src/schemas/user/user.schema';
import { UserController } from 'src/controllers/user/user.controller';
import { UserBusiness } from 'src/business/user/user.bl';
import { UserProvider } from 'src/providers/user/user.provider';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [UserBusiness, UserProvider],
})
export class UserModule {}
