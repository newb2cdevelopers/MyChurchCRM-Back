import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyDirectoryController } from 'src/controllers/companyDirectory/companyDirectory.controller';
import { CompanyDirectoryBusiness } from 'src/business/companyDirectory/companyDirectory.bl';
import { CompanyDirectoryProvider } from 'src/providers/companyDirectory/companyDirectory.provider';
import {
  CompanyDirectory,
  CompanyDirectorySchema,
} from 'src/schemas/companyDirectory/companyDirectory.schema';
import {
  CompanyAudit,
  CompanyAuditSchema,
} from 'src/schemas/companyDirectory/company-audit.schema';
import {
  CompanyCategory,
  CompanyCategorySchema,
} from 'src/schemas/companyCategory/companyCategory.schema';
import { Users, UserSchema } from 'src/schemas/user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompanyDirectory.name, schema: CompanyDirectorySchema },
      { name: CompanyAudit.name, schema: CompanyAuditSchema },
      { name: CompanyCategory.name, schema: CompanyCategorySchema },
      { name: Users.name, schema: UserSchema },
    ]),
  ],
  controllers: [CompanyDirectoryController],
  providers: [CompanyDirectoryBusiness, CompanyDirectoryProvider],
})
export class CompanyDirectoryModule {}
