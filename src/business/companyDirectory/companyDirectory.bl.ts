import { Injectable } from '@nestjs/common';
import {
  CompanyDirectoryCategoryResponseDto,
  CompanyDirectoryInput,
  CompanyDirectoryProductResponseDto,
  CompanyDirectoryResponseDto,
  CompanyDirectoryResponseSocialNetworkDto,
} from 'src/dtos/companyDirectory/companyDirectory.dto';
import {
  CompanyDirectory,
  CompanyDirectoryProduct,
  CompanyDirectorySocialNetwork,
} from 'src/schemas/companyDirectory/companyDirectory.schema';
import { CompanyDirectoryProvider } from 'src/providers/companyDirectory/companyDirectory.provider';
import {
  deleteCloudinaryImageByUrl,
  uploadImageBufferToCloudinary,
} from 'src/utilities/cloudinary';

@Injectable()
export class CompanyDirectoryBusiness {
  constructor(private readonly provider: CompanyDirectoryProvider) {}

  async getAllCompanyDirectories(
    isActive?: boolean,
  ): Promise<CompanyDirectoryResponseDto[]> {
    const companyDirectories = (await this.provider.getAllCompanyDirectories(
      isActive,
    )) as unknown as CompanyDirectory[];

    const ids = companyDirectories
      .map((companyDirectory) => companyDirectory?._id?.toString())
      .filter((id): id is string => !!id);

    const viewsCountById =
      await this.provider.getViewsCountByCompanyDirectoryIds(ids);

    return companyDirectories.map((companyDirectory) => {
      const id = companyDirectory?._id?.toString() ?? '';
      const viewsCount = id ? viewsCountById.get(id) ?? 0 : 0;
      return this.mapCompanyDirectory(companyDirectory, viewsCount);
    });
  }

  async getCompanyDirectoryById(
    id: string,
  ): Promise<CompanyDirectoryResponseDto> {
    const companyDirectory = (await this.provider.getCompanyDirectoryById(
      id,
    )) as unknown as CompanyDirectory;

    return companyDirectory ? this.mapCompanyDirectory(companyDirectory) : null;
  }

  async createCompanyDirectory(
    companyDirectoryInput: CompanyDirectoryInput,
  ): Promise<CompanyDirectoryResponseDto> {
    const companyDirectory = (await this.provider.create(
      companyDirectoryInput,
    )) as unknown as CompanyDirectory;

    return this.mapCompanyDirectory(companyDirectory);
  }

  async updateCompanyDirectory(
    id: string,
    companyDirectoryInput: CompanyDirectoryInput,
  ): Promise<CompanyDirectoryResponseDto> {
    const companyDirectory = (await this.provider.update(
      id,
      companyDirectoryInput,
    )) as unknown as CompanyDirectory;

    return companyDirectory ? this.mapCompanyDirectory(companyDirectory) : null;
  }

  async registerCompanyDirectoryView(id: string): Promise<void> {
    await this.provider.createCompanyAudit(id);
  }

  async addProductToCompany(
    id: string,
    title: string,
    description: string | undefined,
    imageBuffer: Buffer,
    imageOriginalName: string,
  ): Promise<CompanyDirectoryResponseDto> {
    const imageUrl = await uploadImageBufferToCloudinary(
      imageBuffer,
      'mychurchcrm/companyProducts',
      imageOriginalName,
    );

    const company = (await this.provider.addProduct(id, {
      title,
      description,
      imageUrl,
    })) as unknown as CompanyDirectory;

    if (!company) {
      try {
        await deleteCloudinaryImageByUrl(imageUrl);
      } catch {
        // Ignore cleanup error
      }
      return null;
    }

    return this.mapCompanyDirectory(company);
  }

  async removeProductFromCompany(
    id: string,
    productIndex: number,
  ): Promise<CompanyDirectoryResponseDto> {
    const companyDoc = (await this.provider.getCompanyDirectoryById(
      id,
    )) as unknown as CompanyDirectory;

    if (!companyDoc) {
      return null;
    }

    const products =
      companyDoc.products as unknown as CompanyDirectoryProduct[];
    const productToRemove = products[productIndex];

    if (!productToRemove) {
      return null;
    }

    const company = await this.provider.removeProduct(id, productIndex);

    if (!company) {
      return null;
    }

    if (productToRemove.imageUrl) {
      try {
        await deleteCloudinaryImageByUrl(productToRemove.imageUrl);
      } catch {
        // Ignore Cloudinary cleanup error
      }
    }

    return this.mapCompanyDirectory(company as unknown as CompanyDirectory);
  }

  private mapCompanyDirectory(
    companyDirectory: CompanyDirectory,
    viewsCount = 0,
  ): CompanyDirectoryResponseDto {
    const categories = Array.isArray(companyDirectory.categories)
      ? companyDirectory.categories.map((category: any) => ({
          Id: category?._id?.toString
            ? category._id.toString()
            : String(category),
          Name: category?.name ?? '',
        }))
      : [];

    const socialNetworks = Array.isArray(companyDirectory.socialNetworks)
      ? companyDirectory.socialNetworks.map(
          (socialNetwork: CompanyDirectorySocialNetwork) =>
            ({
              Name: socialNetwork.Name,
              Profile: socialNetwork.Profile,
            } as CompanyDirectoryResponseSocialNetworkDto),
        )
      : [];

    return {
      Id: companyDirectory._id?.toString(),
      Name: companyDirectory.name,
      Description: companyDirectory.description,
      Phone: companyDirectory.phone,
      Website: companyDirectory.website,
      Address: companyDirectory.address,
      LogoUrl: companyDirectory.logoUrl,
      Categories: categories as CompanyDirectoryCategoryResponseDto[],
      SocialNetworks: socialNetworks,
      Products: this.mapProducts(companyDirectory.products),
      IsActive: companyDirectory.isActive,
      ViewsCount: viewsCount,
      CreatedBy: companyDirectory.createdBy?.toString(),
      ModifiedBy: companyDirectory.modifiedBy?.toString(),
      CreatedAt: (companyDirectory as any).createdAt,
      UpdatedAt: (companyDirectory as any).updatedAt,
    };
  }

  private mapProducts(products: unknown): CompanyDirectoryProductResponseDto[] {
    if (!Array.isArray(products)) {
      return [];
    }

    return products.map(
      (product: any, index: number) =>
        ({
          Index: index,
          Title: product.title ?? '',
          Description: product.description,
          ImageUrl: product.imageUrl ?? '',
        } as CompanyDirectoryProductResponseDto),
    );
  }
}
