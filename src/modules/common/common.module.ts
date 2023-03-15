import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GospelTexts, GospelTextSchema } from 'src/schemas/common/text.schema';
import { TextController } from 'src/controllers/common/text.controller';
import { CommonBusiness } from 'src/business/common/common.bl';
import { CommonProvider } from 'src/providers/common/common.provider';
import { SettingsController } from 'src/controllers/common/settings.controller';
import { Settings, SettingSchema } from 'src/schemas/common/setting.schema';
import { Languages, LanguageSchema } from 'src/schemas/common/languages.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GospelTexts.name, schema: GospelTextSchema },
      { name: Settings.name, schema: SettingSchema },
      { name: Languages.name, schema: LanguageSchema },
    ]),
  ],
  controllers: [TextController, SettingsController],
  providers: [CommonBusiness, CommonProvider],
})
export class CommonModule {}
