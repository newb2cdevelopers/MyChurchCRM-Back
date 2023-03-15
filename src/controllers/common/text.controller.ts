import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonBusiness } from 'src/business/common/common.bl';
import { GospelTexts } from 'src/schemas/common/text.schema';

@ApiTags('Text')
@Controller('text')
export class TextController {
  constructor(private readonly textBl: CommonBusiness) {}

  @Post('getTexts')
  async newUser(@Body() ids: string[]): Promise<GospelTexts[]> {
    return await this.textBl.getTexts(ids);
  }
}
