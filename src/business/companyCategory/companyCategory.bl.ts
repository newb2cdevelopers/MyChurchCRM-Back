import { Injectable } from '@nestjs/common';
import { CompanyCategoryProvider } from 'src/providers/companyCategory/companyCategory.provider';
import { CompanyCategoryDto } from 'src/dtos/companyCategory/companyCategory.dto';
import { CompanyCategory } from 'src/schemas/companyCategory/companyCategory.schema';

@Injectable()
export class CompanyCategoryBusiness {
  constructor(private readonly provider: CompanyCategoryProvider) {}

  async getAllCompanyCategories(): Promise<CompanyCategoryDto[]> {
    const categories =
      (await this.provider.getAllCompanyCategories()) as unknown as CompanyCategory[];

    return categories.map((category) => ({
      Id: category._id?.toString(),
      Name: category.name,
    }));
  }
}
