import { Injectable } from '@nestjs/common';
import {
  CompanyDirectoryCategoryResponseDto,
  CompanyDirectoryInput,
  CompanyDirectoryResponseDto,
  CompanyDirectoryResponseSocialNetworkDto,
} from 'src/dtos/companyDirectory/companyDirectory.dto';
import {
  CompanyDirectory,
  CompanyDirectorySocialNetwork,
} from 'src/schemas/companyDirectory/companyDirectory.schema';
import { CompanyDirectoryProvider } from 'src/providers/companyDirectory/companyDirectory.provider';

@Injectable()
export class CompanyDirectoryBusiness {
  constructor(private readonly provider: CompanyDirectoryProvider) {}

  async getAllCompanyDirectories(
    isActive?: boolean,
  ): Promise<CompanyDirectoryResponseDto[]> {
    const companyDirectories = (await this.provider.getAllCompanyDirectories(
      isActive,
    )) as unknown as CompanyDirectory[];

    return companyDirectories.map((companyDirectory) =>
      this.mapCompanyDirectory(companyDirectory),
    );
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

  private mapCompanyDirectory(
    companyDirectory: CompanyDirectory,
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
      LogoUrl: companyDirectory.logoUrl,
      Categories: categories as CompanyDirectoryCategoryResponseDto[],
      SocialNetworks: socialNetworks,
      IsActive: companyDirectory.isActive,
      CreatedBy: companyDirectory.createdBy?.toString(),
      ModifiedBy: companyDirectory.modifiedBy?.toString(),
      CreatedAt: (companyDirectory as any).createdAt,
      UpdatedAt: (companyDirectory as any).updatedAt,
    };
  }
}
