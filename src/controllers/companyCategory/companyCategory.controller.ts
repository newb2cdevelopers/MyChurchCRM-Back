import { Controller, Get } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { CompanyCategoryBusiness } from 'src/business/companyCategory/companyCategory.bl';
import { CompanyCategoryDto } from 'src/dtos/companyCategory/companyCategory.dto';

@ApiTags('CompanyCategories')
@Controller('CompanyCategories')
export class CompanyCategoryController {
  constructor(
    private readonly companyCategoryBusiness: CompanyCategoryBusiness,
  ) {}

  @Get()
  @ApiCreatedResponse({
    description: 'Company Categories Info',
    type: CompanyCategoryDto,
    isArray: true,
  })
  async getAllCompanyCategories(): Promise<CompanyCategoryDto[]> {
    return await this.companyCategoryBusiness.getAllCompanyCategories();
  }
}
