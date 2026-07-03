import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChurchBusiness } from 'src/business/church/church.bl';
import { churchDTO } from 'src/schemas/churches/church.DTO';

@ApiTags('Churches')
@Controller('church')
export class ChurchController {
  constructor(private readonly churchBusiness: ChurchBusiness) {}

  @Get()
  @ApiOperation({
    summary: 'Get all churches',
    description: 'Returns a list of all registered churches.',
  })
  @ApiOkResponse({
    description: 'List of churches',
    schema: {
      example: [
        {
          _id: '679d017daf1fff94edac0c1a',
          name: 'Iglesia Central',
          address: 'CR 23 # 30 -40',
        },
      ],
    },
  })
  async getChurches(): Promise<churchDTO[]> {
    return await this.churchBusiness.getAllChurches();
  }
}
