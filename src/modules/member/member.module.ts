import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Members, MemberSchema } from 'src/schemas/member/member.shema';
import { MemberController } from 'src/controllers/member/member.controller';
import { MemberBusiness } from 'src/business/member/member.bl';
import { MemberProvider } from 'src/providers/members/member.provider';
import { PersonModule } from '../person/person.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Members.name, schema: MemberSchema }]),
    PersonModule,
  ],
  controllers: [MemberController],
  providers: [MemberBusiness, MemberProvider],
  exports: [MemberProvider],
})
export class MemberModule {}
