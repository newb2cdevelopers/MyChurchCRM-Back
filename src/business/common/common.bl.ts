import { Injectable } from '@nestjs/common';
import { CommonProvider } from 'src/providers/common/common.provider';
import { Settings } from 'src/schemas/common/setting.schema';
import { GospelTexts } from 'src/schemas/common/text.schema';

@Injectable()
export class CommonBusiness {
  constructor(private readonly provider: CommonProvider) {}

  async getTexts(ids: string[]): Promise<GospelTexts[]> {
    const languageCode = (await this.provider.getBasicSettings()).language;
    return this.provider.getTexts(ids, languageCode) as unknown as Promise<
      GospelTexts[]
    >;
  }

  async getAllSettings(): Promise<Settings[]> {
    return this.provider.getAllSettings() as unknown as Promise<Settings[]>;
  }

  async getSettingById(id: string): Promise<Settings> {
    return this.provider.getSettingById(id) as unknown as Promise<Settings>;
  }

  async getSettingByKey(key: string) {
    return this.provider.getSettingByKey(key) as unknown as Promise<Settings>;
  }

  async settingExistByKey(key: string) {
    const user = await this.provider.getSettingByKey(key);
    return user !== null;
  }

  async newSetting(setting: Settings): Promise<Settings> {
    const settingExist = await this.provider.getSettingByKey(setting.key);
    if (settingExist) return null;

    return this.provider.newSetting(setting) as unknown as Promise<Settings>;
  }

  async updateSetting(id: string, setting: Settings): Promise<Settings> {
    return this.provider.updateSetting(
      id,
      setting,
    ) as unknown as Promise<Settings>;
  }

  async deleteSetting(id: string): Promise<void> {
    this.provider.deleteSetting(id);
  }
}
