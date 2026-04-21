import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CompanyDirectory,
  CompanyDirectoryDocument,
} from 'src/schemas/companyDirectory/companyDirectory.schema';
import { CompanyDirectoryInput } from 'src/dtos/companyDirectory/companyDirectory.dto';

@Injectable()
export class CompanyDirectoryProvider {
  constructor(
    @InjectModel(CompanyDirectory.name)
    private companyDirectoryModel: Model<CompanyDirectoryDocument>,
  ) {}

  async getAllCompanyDirectories(isActive?: boolean) {
    const filter: Record<string, unknown> = {};

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    return this.companyDirectoryModel.find(filter).populate('categories');
  }

  async getCompanyDirectoryById(id: string) {
    return this.companyDirectoryModel.findById(id).populate('categories');
  }

  async create(newCompanyDirectory: CompanyDirectoryInput) {
    const companyDirectory = await this.companyDirectoryModel.create(
      newCompanyDirectory,
    );

    return companyDirectory.populate('categories');
  }

  async update(id: string, updatedCompanyDirectory: CompanyDirectoryInput) {
    const companyDirectory = await this.companyDirectoryModel.findById(id);

    if (!companyDirectory) {
      return null;
    }

    if (updatedCompanyDirectory.name !== undefined) {
      companyDirectory.name = updatedCompanyDirectory.name;
    }

    if (updatedCompanyDirectory.description !== undefined) {
      companyDirectory.description = updatedCompanyDirectory.description;
    }

    if (updatedCompanyDirectory.phone !== undefined) {
      companyDirectory.phone = updatedCompanyDirectory.phone;
    }

    if (updatedCompanyDirectory.website !== undefined) {
      companyDirectory.website = updatedCompanyDirectory.website;
    }

    if (updatedCompanyDirectory.logoUrl !== undefined) {
      companyDirectory.logoUrl = updatedCompanyDirectory.logoUrl;
    }

    if (updatedCompanyDirectory.categories !== undefined) {
      companyDirectory.categories = updatedCompanyDirectory.categories;
    }

    if (updatedCompanyDirectory.socialNetworks !== undefined) {
      companyDirectory.socialNetworks = updatedCompanyDirectory.socialNetworks;
    }

    if (updatedCompanyDirectory.modifiedBy !== undefined) {
      companyDirectory.modifiedBy = updatedCompanyDirectory.modifiedBy;
    }

    if (updatedCompanyDirectory.isActive !== undefined) {
      companyDirectory.isActive = updatedCompanyDirectory.isActive;
    }

    await companyDirectory.save();

    return companyDirectory.populate('categories');
  }
}
