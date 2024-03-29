import { Body, Controller, Get, Post, Put, Request, Param, NotFoundException, InternalServerErrorException, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { Members } from 'src/schemas/member/member.shema';
import { ApiBody, ApiCreatedResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MemberBusiness } from 'src/business/member/member.bl';
import { MemberGeneralInfoDto, AdditionalAcademicStudyDto, RelativeDto, MemberMinistryStudyDto, MemberWorkFrontDto } from 'src/schemas/member/Member.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { MAINWORKFRONTID } from 'src/Constants';
@ApiTags('Members')
@Controller('member')
export class MemberController {
  constructor(private readonly memberBusiness: MemberBusiness) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiCreatedResponse({ description: 'Member Info' })
  async getMembers(@Query() query, @Request() req): Promise< Members [] > {
    

    let workfrontId = req.user.workfront &&  req.user.workfront.toString();

    if (!workfrontId) {
      return []; 
    }

    if ( workfrontId === MAINWORKFRONTID) {
      workfrontId = null;
    }

    return  await this.memberBusiness.getAllMembers(query && query.churchId, workfrontId);
  }

  @Get("getMemberByIdentifier/:isSearchById/:identifier")
  async getMemberByIdOrDocument(@Param('isSearchById') isSearchById : Boolean, @Param('identifier') identifier: string ): Promise< Members > {
    
    try {
      const result =  await this.memberBusiness.getMemberByIdOrDocument(isSearchById, identifier);
    
      if (!result) throw new NotFoundException('User Not Found');

      return result
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error in server');
    }

  }

  @Post()
  async Create(@Body() member: Members, @Request() req):  Promise<GeneralResponse> {
    return await this.memberBusiness.create(member);
  }

  @Put('updateMemberInfo/:memberId')
  async updateMemberGeneralInfo(
    @Param('memberId') memberId: string,
    @Body() updatedMember: MemberGeneralInfoDto,
  ): Promise<GeneralResponse> {
    return await this.memberBusiness.updateGeneralMemberInfo(memberId, updatedMember);
  }

  @Put('updateAcademicStudy/:memberId')
  async updateAdditionalAcademicStudies(
    @Param('memberId') memberId: string,
    @Body() additionalAcademicData: AdditionalAcademicStudyDto,
  ): Promise<GeneralResponse> {
    return await this.memberBusiness.updateAdditionalAcademicStudies(memberId, additionalAcademicData);
  }

  @Put('updateRelativeInfo/:memberId')
  async updateRelativeInformation(
    @Param('memberId') memberId: string,
    @Body()  relativeData: RelativeDto,
  ): Promise<GeneralResponse> {
    return await this.memberBusiness.updateRelativeInformation(memberId, relativeData);
  }

  @Put('updateMinistryStudiesInfo/:memberId')
  async updateMinistryStudies(
    @Param('memberId') memberId: string,
    @Body()  ministryStudiesData: MemberMinistryStudyDto,
  ): Promise<GeneralResponse> {
    return await this.memberBusiness.updateMinistryStudies(memberId, ministryStudiesData);
  }

  @Put('updateWorkfrontsInfo/:memberId')
  async updateWorkfronts(
    @Param('memberId') memberId: string,
    @Body()  workfrontData: MemberWorkFrontDto,
  ): Promise<GeneralResponse> {
    return await this.memberBusiness.updateWorkfronts(memberId, workfrontData);
  }
}
