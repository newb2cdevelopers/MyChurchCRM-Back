import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Members, MemberSchema} from 'src/schemas/member/member.shema';
import { MemberController } from 'src/controllers/member/member.controller';
import { MemberBusiness } from 'src/business/member/member.bl';
import { MemberProvider } from 'src/providers/members/member.provider';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Members.name, schema: MemberSchema }]),
  ],
  controllers: [MemberController],
  providers: [MemberBusiness, MemberProvider],
})
export class MemberModule {}
