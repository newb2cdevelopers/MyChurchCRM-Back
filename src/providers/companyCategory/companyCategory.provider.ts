import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CompanyCategory,
  CompanyCategoryDocument,
} from 'src/schemas/companyCategory/companyCategory.schema';

@Injectable()
export class CompanyCategoryProvider {
  constructor(
    @InjectModel(CompanyCategory.name)
    private companyCategoryModel: Model<CompanyCategoryDocument>,
  ) {}

  async getAllCompanyCategories() {
    return this.companyCategoryModel.find();
  }
}
