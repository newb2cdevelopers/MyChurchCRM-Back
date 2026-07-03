import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { Auth } from 'src/modules/auth/auth.decorator';
import { JWTPayload } from 'src/schemas/auth/JWTPayload';
import { Members } from 'src/schemas/member/member.shema';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MemberBusiness } from 'src/business/member/member.bl';
import {
  MemberGeneralInfoDto,
  AdditionalAcademicStudyDto,
  RelativeDto,
  MemberMinistryStudyDto,
  MemberWorkFrontDto,
} from 'src/schemas/member/Member.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { PaginatedResult } from 'src/dtos/pagination.dto';
import { MAINWORKFRONTID } from 'src/Constants';

@ApiTags('Members')
@Controller('member')
export class MemberController {
  constructor(private readonly memberBusiness: MemberBusiness) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({
    summary: 'Get all members',
    description:
      "Returns a paginated list of members filtered by the logged user's church and workfront. Supports search and pagination.",
  })
  @ApiOkResponse({
    description: 'Paginated list of members',
    schema: {
      example: {
        data: [
          {
            _id: '679d017daf1fff94edac0c1a',
            fullName: 'Carlos Mario',
            documentNumber: '1236566',
            documentType: 'CC',
            mobilePhone: '316929417',
            address: 'CR 23 # 30 -40',
          },
        ],
        metadata: { currentPage: 1, totalPages: 5, totalRecords: 50 },
      },
    },
  })
  async getMembers(
    @Auth() user: JWTPayload,
    @Query('search') search: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ): Promise<PaginatedResult<Members>> {
    let workfrontId = user.workfront;

    if (!workfrontId) {
      return {
        data: [],
        metadata: { currentPage: 1, totalPages: 0, totalRecords: 0 },
      };
    }

    if (workfrontId === MAINWORKFRONTID) {
      workfrontId = null;
    }

    return await this.memberBusiness.getAllMembers(
      user.churchId,
      workfrontId,
      search,
      page,
      limit,
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get member by ID',
    description:
      'Returns the full details of a member including populated workfront.',
  })
  @ApiOkResponse({
    description: 'Member found',
    schema: {
      example: {
        _id: '679d017daf1fff94edac0c1a',
        fullName: 'Carlos Mario',
        documentNumber: '1236566',
        documentType: 'CC',
        mobilePhone: '316929417',
        address: 'CR 23 # 30 -40',
        workfront: { _id: 'abc123', name: 'Alabanza' },
        relatives: [],
        ministryStudies: [],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Member not found' })
  @ApiParam({ name: 'id', required: true, description: 'Member MongoDB ID' })
  async getMemberById(@Param('id') id: string): Promise<Members> {
    const result = await this.memberBusiness.getMemberById(id);

    if (!result) throw new NotFoundException('Member not found');

    return result;
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Create a new member',
    description:
      'Creates a new member with general information, academic studies, relatives, and ministry data.',
  })
  @ApiCreatedResponse({
    description: 'Member created successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: {
          _id: '679d017daf1fff94edac0c1a',
          fullName: 'Carlos Mario',
          documentNumber: '1236566',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    schema: {
      example: { isSuccessful: false, message: 'El miembro ya existe' },
    },
  })
  @ApiBody({ type: MemberGeneralInfoDto })
  async Create(@Body() member: MemberGeneralInfoDto): Promise<GeneralResponse> {
    return await this.memberBusiness.create(member);
  }

  @UseGuards(AuthGuard)
  @Put('updateMemberInfo/:memberId')
  @ApiOperation({
    summary: 'Update member general info',
    description: 'Updates the general information of an existing member.',
  })
  @ApiOkResponse({
    description: 'Member updated successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: { _id: '679d017daf1fff94edac0c1a' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid member ID',
    schema: {
      example: { isSuccessful: false, message: 'El miembro no es válido' },
    },
  })
  @ApiParam({
    name: 'memberId',
    required: true,
    description: 'Member ID',
  })
  @ApiBody({ type: MemberGeneralInfoDto })
  async updateMemberGeneralInfo(
    @Param('memberId') memberId: string,
    @Body() updatedMember: MemberGeneralInfoDto,
  ): Promise<GeneralResponse> {
    return await this.memberBusiness.updateGeneralMemberInfo(
      memberId,
      updatedMember,
    );
  }

  @UseGuards(AuthGuard)
  @Put('updateAcademicStudy/:memberId')
  @ApiOperation({
    summary: 'Update academic studies',
    description: 'Updates the additional academic studies of a member.',
  })
  @ApiOkResponse({
    description: 'Academic studies updated successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: { _id: '679d017daf1fff94edac0c1a' },
      },
    },
  })
  @ApiParam({
    name: 'memberId',
    required: true,
    description: 'Member ID',
  })
  @ApiBody({ type: AdditionalAcademicStudyDto })
  async updateAdditionalAcademicStudies(
    @Param('memberId') memberId: string,
    @Body() additionalAcademicData: AdditionalAcademicStudyDto,
  ): Promise<GeneralResponse> {
    return await this.memberBusiness.updateAdditionalAcademicStudies(
      memberId,
      additionalAcademicData,
    );
  }

  @UseGuards(AuthGuard)
  @Put('updateRelativeInfo/:memberId')
  @ApiOperation({
    summary: 'Update relative information',
    description: 'Updates the relatives / family information of a member.',
  })
  @ApiOkResponse({
    description: 'Relative information updated successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: { _id: '679d017daf1fff94edac0c1a' },
      },
    },
  })
  @ApiParam({
    name: 'memberId',
    required: true,
    description: 'Member ID',
  })
  @ApiBody({ type: RelativeDto })
  async updateRelativeInformation(
    @Param('memberId') memberId: string,
    @Body() relativeData: RelativeDto,
  ): Promise<GeneralResponse> {
    return await this.memberBusiness.updateRelativeInformation(
      memberId,
      relativeData,
    );
  }

  @UseGuards(AuthGuard)
  @Put('updateMinistryStudiesInfo/:memberId')
  @ApiOperation({
    summary: 'Update ministry studies',
    description:
      'Updates the ministry / biblical studies information of a member.',
  })
  @ApiOkResponse({
    description: 'Ministry studies updated successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: { _id: '679d017daf1fff94edac0c1a' },
      },
    },
  })
  @ApiParam({
    name: 'memberId',
    required: true,
    description: 'Member ID',
  })
  @ApiBody({ type: MemberMinistryStudyDto })
  async updateMinistryStudies(
    @Param('memberId') memberId: string,
    @Body() ministryStudiesData: MemberMinistryStudyDto,
  ): Promise<GeneralResponse> {
    return await this.memberBusiness.updateMinistryStudies(
      memberId,
      ministryStudiesData,
    );
  }

  @UseGuards(AuthGuard)
  @Put('updateWorkfrontsInfo/:memberId')
  @ApiOperation({
    summary: 'Update workfront assignments',
    description:
      'Updates the workfront (ministry front) assignments of a member.',
  })
  @ApiOkResponse({
    description: 'Workfront assignments updated successfully',
    schema: {
      example: {
        isSuccessful: true,
        data: { _id: '679d017daf1fff94edac0c1a' },
      },
    },
  })
  @ApiParam({
    name: 'memberId',
    required: true,
    description: 'Member ID',
  })
  @ApiBody({ type: MemberWorkFrontDto })
  async updateWorkfronts(
    @Param('memberId') memberId: string,
    @Body() workfrontData: MemberWorkFrontDto,
  ): Promise<GeneralResponse> {
    return await this.memberBusiness.updateWorkfronts(memberId, workfrontData);
  }
}
