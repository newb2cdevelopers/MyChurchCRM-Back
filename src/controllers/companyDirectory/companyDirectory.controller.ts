import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Types } from 'mongoose';
import { Request } from 'express';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { CompanyDirectoryBusiness } from 'src/business/companyDirectory/companyDirectory.bl';
import {
  CompanyDirectoryCreateRequestDto,
  CompanyDirectoryInput,
  CompanyDirectoryResponseDto,
  CompanyDirectoryUpdateRequestDto,
} from 'src/dtos/companyDirectory/companyDirectory.dto';

const companyDirectoryUploadsPath = join(
  process.cwd(),
  'uploads',
  'companyDirectories',
);

interface UploadedLogoFile {
  buffer: Buffer;
  originalname: string;
}

@ApiTags('CompanyDirectories')
@Controller('companyDirectories')
export class CompanyDirectoryController {
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
    const logoUrl = this.storeLogo(logo);

    return await this.companyDirectoryBusiness.createCompanyDirectory({
      name: body.name,
      description: body.description,
      phone: body.phone,
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

    const logoUrl = logo ? this.storeLogo(logo) : undefined;

    const updatedCompanyDirectory =
      await this.companyDirectoryBusiness.updateCompanyDirectory(id, {
        name: body.name,
        description: body.description,
        phone: body.phone,
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

    return updatedCompanyDirectory;
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
          throw new Error();
        }

        return parsed as T[];
      } catch {
        throw new BadRequestException(`${fieldName} must be a JSON array`);
      }
    }

    throw new BadRequestException(`${fieldName} must be a JSON array`);
  }

  private storeLogo(logo?: UploadedLogoFile): string | undefined {
    if (!logo) {
      return undefined;
    }

    if (!existsSync(companyDirectoryUploadsPath)) {
      mkdirSync(companyDirectoryUploadsPath, { recursive: true });
    }

    const safeFileName = `${Date.now()}-${logo.originalname.replace(
      /[^a-zA-Z0-9._-]/g,
      '_',
    )}`;
    const absolutePath = join(companyDirectoryUploadsPath, safeFileName);
    writeFileSync(absolutePath, logo.buffer);

    return `/uploads/companyDirectories/${safeFileName}`;
  }
}
