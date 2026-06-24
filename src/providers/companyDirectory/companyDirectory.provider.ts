import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CompanyDirectory,
  CompanyDirectoryDocument,
} from 'src/schemas/companyDirectory/companyDirectory.schema';
import {
  CompanyAudit,
  CompanyAuditDocument,
} from 'src/schemas/companyDirectory/company-audit.schema';
import { CompanyDirectoryInput } from 'src/dtos/companyDirectory/companyDirectory.dto';

@Injectable()
export class CompanyDirectoryProvider {
  constructor(
    @InjectModel(CompanyDirectory.name)
    private companyDirectoryModel: Model<CompanyDirectoryDocument>,

    @InjectModel(CompanyAudit.name)
    private companyAuditModel: Model<CompanyAuditDocument>,
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

    if (updatedCompanyDirectory.address !== undefined) {
      companyDirectory.address = updatedCompanyDirectory.address;
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

  async createCompanyAudit(companyDirectoryId: string) {
    return this.companyAuditModel.create({ companyDirectoryId });
  }

  async getViewsCountByCompanyDirectoryIds(companyDirectoryIds: string[]) {
    if (
      !Array.isArray(companyDirectoryIds) ||
      companyDirectoryIds.length === 0
    ) {
      return new Map<string, number>();
    }

    const objectIds = companyDirectoryIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (objectIds.length === 0) {
      return new Map<string, number>();
    }

    const rows = await this.companyAuditModel
      .aggregate([
        { $match: { companyDirectoryId: { $in: objectIds } } },
        { $group: { _id: '$companyDirectoryId', count: { $sum: 1 } } },
      ])
      .exec();

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(String(row._id), Number(row.count) || 0);
    }

    return map;
  }

  async addProduct(
    companyId: string,
    product: { title: string; description?: string; imageUrl: string },
  ) {
    const company = await this.companyDirectoryModel.findById(companyId);

    if (!company) {
      return null;
    }

    company.products.push(product);
    await company.save();
    return company.populate('categories');
  }

  async removeProduct(companyId: string, productIndex: number) {
    const company = await this.companyDirectoryModel.findById(companyId);

    if (!company) {
      return null;
    }

    if (productIndex < 0 || productIndex >= company.products.length) {
      return null;
    }

    company.products.splice(productIndex, 1);
    await company.save();
    return company.populate('categories');
  }
}
