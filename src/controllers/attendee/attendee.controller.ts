import {
  Body,
  Controller,
  Post,
  Put,
  Get,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttendeeBusiness } from 'src/business/attendee/attendee.bl';
import { AttendeeDTO } from 'src/schemas/attendee/attendee.DTO';
import { Attendee } from 'src/schemas/attendee/attendee.schema';
import { BulkLoadResponse } from 'src/dtos/BulkLoadResponse';

@ApiTags('Attendees')
@Controller('attendee')
export class AttendeeController {
  constructor(private readonly attendeeBl: AttendeeBusiness) {}

  @Get()
  async getAll(): Promise<Attendee[]> {
    return await this.attendeeBl.getAllAttendee();
  }

  @Post()
  async createAttendee(@Body() attendee: AttendeeDTO): Promise<Attendee> {
    console.log(attendee);
    return await this.attendeeBl.create(attendee);
  }

  @Put('/:atendeeId')
  async updateAtendee(
    @Param('atendeeId') atendeeId: string,
    @Body() atendee: AttendeeDTO,
  ): Promise<boolean> {
    return await this.attendeeBl.update(atendeeId, atendee);
  }

  @Post('CreateCollection')
  async createAttendees(
    @Body() attendees: AttendeeDTO[],
  ): Promise<BulkLoadResponse[]> {
    return await this.attendeeBl.createCollection(attendees);
  }

  @Get(':documentNumber')
  async getEventByChurch(
    @Param('documentNumber') documentNumber: string,
  ): Promise<Attendee> {
    const attendee = await this.attendeeBl.getAllAttendeeByDocumentNumber(
      documentNumber,
    );

    if (attendee) {
      return attendee;
    }

    return new Attendee();
  }
}
