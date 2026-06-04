import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Types } from 'mongoose';
import { Request } from 'express';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { CompanyDirectoryBusiness } from 'src/business/companyDirectory/companyDirectory.bl';
import {
  deleteCloudinaryImageByUrl,
  uploadImageBufferToCloudinary,
} from 'src/utilities/cloudinary';
import {
  CompanyDirectoryCreateRequestDto,
  CompanyDirectoryResponseDto,
  CompanyDirectoryUpdateRequestDto,
  CreateProductRequestDto,
} from 'src/dtos/companyDirectory/companyDirectory.dto';

interface UploadedLogoFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@ApiTags('CompanyDirectories')
@Controller('companyDirectories')
export class CompanyDirectoryController {
  private readonly logger = new Logger(CompanyDirectoryController.name);

  constructor(
    private readonly companyDirectoryBusiness: CompanyDirectoryBusiness,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Company directories info', isArray: true })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
    example: 'true',
  })
  async getAllCompanyDirectories(
    @Query('isActive') isActive?: string,
  ): Promise<CompanyDirectoryResponseDto[]> {
    return await this.companyDirectoryBusiness.getAllCompanyDirectories(
      this.parseBooleanQuery(isActive),
    );
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Company directory info' })
  async getCompanyDirectoryById(
    @Param('id') id: string,
  ): Promise<CompanyDirectoryResponseDto> {
    this.ensureValidObjectId(id);

    const companyDirectory =
      await this.companyDirectoryBusiness.getCompanyDirectoryById(id);

    if (!companyDirectory) {
      throw new NotFoundException('Company directory not found');
    }

    return companyDirectory;
  }

  @Post(':id/register-view')
  @ApiOkResponse({ description: 'Company directory view registered' })
  async registerCompanyDirectoryView(@Param('id') id: string): Promise<void> {
    this.ensureValidObjectId(id);
    await this.companyDirectoryBusiness.registerCompanyDirectoryView(id);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiBearerAuth('access token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'My Company' },
        description: { type: 'string', example: 'Company description' },
        phone: { type: 'string', example: '3001234567' },
        address: {
          type: 'string',
          example: 'Cra 45 # 12-34',
          description: 'Dirección física de la empresa',
        },
        website: { type: 'string', example: 'https://mycompany.com' },
        categories: {
          type: 'string',
          example: '["67f8e5f2df278b4b31df8a0d"]',
          description: 'JSON array of category IDs',
        },
        socialNetworks: {
          type: 'string',
          example:
            '[{"Name":"Facebook","Profile":"https://facebook.com/my-company"}]',
          description: 'JSON array of social networks',
        },
        isActive: {
          type: 'string',
          example: 'true',
          description: 'true or false',
        },
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Company logo image file',
        },
      },
      required: ['name', 'description', 'phone'],
    },
  })
  @ApiCreatedResponse({ description: 'Company directory created' })
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  async createCompanyDirectory(
    @Body() body: CompanyDirectoryCreateRequestDto,
    @UploadedFile() logo?: UploadedLogoFile,
    @Req() request?: Request,
  ): Promise<CompanyDirectoryResponseDto> {
    const logoUrl = await this.storeLogo(logo);

    return await this.companyDirectoryBusiness.createCompanyDirectory({
      name: body.name,
      description: body.description,
      phone: body.phone,
      address: body.address,
      website: body.website,
      categories: this.parseJsonArray<string>(body.categories, 'categories'),
      socialNetworks: this.parseJsonArray(
        body.socialNetworks,
        'socialNetworks',
      ),
      isActive:
        body.isActive === undefined
          ? true
          : body.isActive.toString().toLowerCase() === 'true',
      logoUrl,
      createdBy: String((request as any)?.user?._id),
      modifiedBy: String((request as any)?.user?._id),
    });
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @ApiBearerAuth('access token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'My Company' },
        description: { type: 'string', example: 'Company description' },
        phone: { type: 'string', example: '3001234567' },
        address: {
          type: 'string',
          example: 'Cra 45 # 12-34',
          description: 'Dirección física de la empresa',
        },
        website: { type: 'string', example: 'https://mycompany.com' },
        categories: {
          type: 'string',
          example: '["67f8e5f2df278b4b31df8a0d"]',
          description: 'JSON array of category IDs',
        },
        socialNetworks: {
          type: 'string',
          example:
            '[{"Name":"Facebook","Profile":"https://facebook.com/my-company"}]',
          description: 'JSON array of social networks',
        },
        isActive: {
          type: 'string',
          example: 'true',
          description: 'true or false',
        },
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Company logo image file (optional)',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Company directory updated' })
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  async updateCompanyDirectory(
    @Param('id') id: string,
    @Body() body: CompanyDirectoryUpdateRequestDto,
    @UploadedFile() logo?: UploadedLogoFile,
    @Req() request?: Request,
  ): Promise<CompanyDirectoryResponseDto> {
    this.ensureValidObjectId(id);

    const existingCompanyDirectory =
      await this.companyDirectoryBusiness.getCompanyDirectoryById(id);

    if (!existingCompanyDirectory) {
      throw new NotFoundException('Company directory not found');
    }

    const logoUrl = logo ? await this.storeLogo(logo) : undefined;

    const updatedCompanyDirectory =
      await this.companyDirectoryBusiness.updateCompanyDirectory(id, {
        name: body.name,
        description: body.description,
        phone: body.phone,
        address: body.address,
        website: body.website,
        categories:
          body.categories !== undefined
            ? this.parseJsonArray<string>(body.categories, 'categories')
            : undefined,
        socialNetworks:
          body.socialNetworks !== undefined
            ? this.parseJsonArray(body.socialNetworks, 'socialNetworks')
            : undefined,
        isActive:
          body.isActive === undefined
            ? undefined
            : body.isActive.toString().toLowerCase() === 'true',
        logoUrl,
        modifiedBy: String((request as any)?.user?._id),
      });

    if (!updatedCompanyDirectory) {
      throw new NotFoundException('Company directory not found');
    }

    if (
      logo &&
      existingCompanyDirectory.LogoUrl &&
      updatedCompanyDirectory.LogoUrl &&
      existingCompanyDirectory.LogoUrl !== updatedCompanyDirectory.LogoUrl
    ) {
      try {
        await deleteCloudinaryImageByUrl(existingCompanyDirectory.LogoUrl);
      } catch (error) {
        this.logger.warn(
          `Failed to delete previous logo from Cloudinary: ${existingCompanyDirectory.LogoUrl}`,
        );
      }
    }

    return updatedCompanyDirectory;
  }

  @UseGuards(AuthGuard)
  @Post(':id/products')
  @ApiBearerAuth('access token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Product title' },
        description: {
          type: 'string',
          example: 'Product description',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Product image file',
        },
      },
      required: ['title', 'image'],
    },
  })
  @ApiCreatedResponse({ description: 'Product added to company' })
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async addProduct(
    @Param('id') id: string,
    @Body() body: CreateProductRequestDto,
    @UploadedFile() image: UploadedLogoFile,
  ): Promise<CompanyDirectoryResponseDto> {
    this.ensureValidObjectId(id);

    if (!image) {
      throw new BadRequestException('Image file is required');
    }

    if (!image.mimetype || !image.mimetype.startsWith('image/')) {
      throw new BadRequestException('The file must be a valid image');
    }

    const existingCompany =
      await this.companyDirectoryBusiness.getCompanyDirectoryById(id);

    if (!existingCompany) {
      throw new NotFoundException('Company directory not found');
    }

    if (
      Array.isArray(existingCompany.Products) &&
      existingCompany.Products.length >= 5
    ) {
      throw new BadRequestException(
        'The company already has the maximum of 5 products',
      );
    }

    const updatedCompany =
      await this.companyDirectoryBusiness.addProductToCompany(
        id,
        body.title,
        body.description,
        image.buffer,
        image.originalname,
      );

    if (!updatedCompany) {
      throw new NotFoundException('Company directory not found');
    }

    return updatedCompany;
  }

  @UseGuards(AuthGuard)
  @Delete(':id/products/:productIndex')
  @ApiBearerAuth('access token')
  @ApiOkResponse({ description: 'Product removed from company' })
  async removeProduct(
    @Param('id') id: string,
    @Param('productIndex') productIndex: string,
  ): Promise<CompanyDirectoryResponseDto> {
    this.ensureValidObjectId(id);

    const index = parseInt(productIndex, 10);

    if (isNaN(index) || index < 0) {
      throw new BadRequestException('Invalid product index');
    }

    const updatedCompany =
      await this.companyDirectoryBusiness.removeProductFromCompany(id, index);

    if (!updatedCompany) {
      throw new NotFoundException('Company directory or product not found');
    }

    return updatedCompany;
  }

  private parseBooleanQuery(value?: string): boolean | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return value.toLowerCase() === 'true';
  }

  private ensureValidObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
  }

  private parseJsonArray<T>(
    value: unknown,
    fieldName: string,
  ): T[] | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value as T[];
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);

        if (!Array.isArray(parsed)) {
          if (fieldName === 'categories' && value.trim() !== '') {
            return [value.trim() as T];
          }

          throw new Error();
        }

        return parsed as T[];
      } catch {
        if (fieldName === 'categories' && value.trim() !== '') {
          return [value.trim() as T];
        }

        throw new BadRequestException(`${fieldName} must be a JSON array`);
      }
    }

    throw new BadRequestException(`${fieldName} must be a JSON array`);
  }

  private async storeLogo(
    logo?: UploadedLogoFile,
  ): Promise<string | undefined> {
    if (!logo) {
      return undefined;
    }

    return await uploadImageBufferToCloudinary(
      logo.buffer,
      'mychurchcrm/companyDirectories',
      logo.originalname,
    );
  }
}
