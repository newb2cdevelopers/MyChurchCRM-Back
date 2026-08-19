import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { ChurchBusiness } from 'src/business/church/church.bl';
import { Church } from 'src/schemas/churches/church.schema';
import { UpdateChurchServicesDto } from 'src/schemas/churches/church.DTO';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';

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
          services: [{ day: 'Domingo', time: '07:00 am' }],
        },
      ],
    },
  })
  async getChurches(): Promise<Church[]> {
    return this.churchBusiness.getAllChurches();
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({
    summary: 'Get church by ID',
    description: 'Returns a single church including its services.',
  })
  @ApiOkResponse({
    description: 'Church details',
    schema: {
      example: {
        _id: '679d017daf1fff94edac0c1a',
        name: 'Iglesia Central',
        services: [{ day: 'Domingo', time: '07:00 am' }],
      },
    },
  })
  async getChurchById(@Param('id') id: string) {
    return this.churchBusiness.getById(id);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Put(':id/services')
  @ApiOperation({
    summary: 'Update church services',
    description:
      'Replaces the list of services (day + time) of a church. Requires authentication.',
  })
  @ApiOkResponse({
    description: 'Services updated',
    schema: {
      example: {
        isSuccessful: true,
        message: 'Servicios actualizados correctamente',
      },
    },
  })
  async updateChurchServices(
    @Param('id') id: string,
    @Body() body: UpdateChurchServicesDto,
  ): Promise<GeneralResponse> {
    return this.churchBusiness.updateServices(id, body.services || []);
  }
}
