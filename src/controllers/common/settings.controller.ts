import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Request
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommonBusiness } from 'src/business/common/common.bl';
import { Settings } from 'src/schemas/common/setting.schema';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly commonBl: CommonBusiness) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async saveSetting(setting: Settings): Promise<Settings> {
    return await this.commonBl.newSetting(setting);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getAllSettings(@Request() req): Promise<Settings[]> {
    console.log(req.user);
    
    return await this.commonBl.getAllSettings();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getSettingById(@Param('id') id: string): Promise<Settings> {
    return await this.commonBl.getSettingById(id);
  }

  @Post('settingExist')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async settingExistByKey(@Body() setting: Settings): Promise<boolean> {
    return await this.commonBl.settingExistByKey(setting.key);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async updateSetting(
    @Param('id') id: string,
    @Body() user: Settings,
  ): Promise<Settings> {
    return await this.commonBl.updateSetting(id, user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async deleteSetting(@Param('id') id: string): Promise<void> {
    return await this.commonBl.deleteSetting(id);
  }
}
