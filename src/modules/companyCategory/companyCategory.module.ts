import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyCategoryController } from 'src/controllers/companyCategory/companyCategory.controller';
import { CompanyCategoryBusiness } from 'src/business/companyCategory/companyCategory.bl';
import { CompanyCategoryProvider } from 'src/providers/companyCategory/companyCategory.provider';
import {
  CompanyCategory,
  CompanyCategorySchema,
} from 'src/schemas/companyCategory/companyCategory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompanyCategory.name, schema: CompanyCategorySchema },
    ]),
  ],
  controllers: [CompanyCategoryController],
  providers: [CompanyCategoryBusiness, CompanyCategoryProvider],
})
export class CompanyCategoryModule {}
