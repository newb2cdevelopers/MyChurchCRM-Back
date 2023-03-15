import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeneralSettingsDTO } from 'src/schemas/common/generalSettingsDTO';
import {
  LanguageDocument,
  Languages,
} from 'src/schemas/common/languages.schema';
import { SettingDocument, Settings } from 'src/schemas/common/setting.schema';
import {
  GospelTextDocument,
  GospelTexts,
} from 'src/schemas/common/text.schema';

@Injectable()
export class CommonProvider {
  constructor(
    @InjectModel(GospelTexts.name) private textModel: Model<GospelTextDocument>,
    @InjectModel(Settings.name) private settingModel: Model<SettingDocument>,
    @InjectModel(Languages.name) private languageModel: Model<LanguageDocument>,
  ) {}

  async getTexts(ids: string[], languageCode: string) {
    return  this.textModel.find({ key: { $in: ids }, languageCode });
  }


  async getBasicSettings() {
    const langage = await  this.languageModel.findOne({ selected: true });

    const result = new GeneralSettingsDTO();
      if (langage) result.language = langage.code;
      return result;
  }

  async getAllSettings() {
    return  this.settingModel.find();
  }

  async getSettingById(id: string) {
    return this.settingModel.findById(id).lean();
  }

  async getSettingByKey(key: string) {
    return this.settingModel.findOne({ key }).select('-__v -confirmToken');
  }

  async newSetting(setting: Settings) {
    return this.settingModel.create(setting);
  }

  async updateSetting(id: string, setting: Settings) {
    return this.settingModel.updateOne(
      {
        _id: id,
      },
      setting,
    );
  }

  async deleteSetting(id: string) {
    this.settingModel.deleteOne({
      _id: id,
    });
  }
}
