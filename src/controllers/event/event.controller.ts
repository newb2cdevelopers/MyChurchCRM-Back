import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Param,
  Put,
  Query,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { EventBusiness } from 'src/business/event/event.bl';
import { Events } from 'src/schemas/events/event.shema';
import { Booking as BookingS, BookingDocument } from 'src/schemas/bookings/booking.schema';
import { EventDTO, CreateEventDTO } from 'src/schemas/events/event.DTO';
import { Booking } from 'src/schemas/events/Boooking.type';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { BulkLoadResponse } from 'src/dtos/BulkLoadResponse';

@ApiTags('Event')
@ApiBearerAuth()
@Controller('event')
export class EventController {
  constructor(private readonly eventBL: EventBusiness) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async newEvent(@Body() event: EventDTO, @Request() req): Promise<Events> {
    let mappedEvent = { ...event, user: req.user._id, status: 'Pendiente' };

    return await this.eventBL.createEvent(mappedEvent);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAll(): Promise<Events[]> {
    return await this.eventBL.getAll();
  }

  @Get('eventsByChurch/:churchId')
  async getEventByChurch(
    @Param('churchId') churchId: string,
  ): Promise<Events[]> {
    console.log(churchId);

    return await this.eventBL.getByChurchId(churchId);
  }

  @Post('addBooking/:eventId')
  async addBooking(
    @Param('eventId') eventId: string,
    @Body() newBooking: CreateEventDTO,
  ): Promise<Events> {
    return await this.eventBL.addBooking(newBooking, eventId);
  }

  @Put('updateEvent/:eventId')
  async updateEvent(
    @Param('eventId') eventId: string,
    @Body() event: EventDTO,
  ): Promise<boolean> {
    return await this.eventBL.updateEvent(eventId, event);
  }

  @Get('updateBooking/:bookingId/:newStatus')
  async updateBooking(
    @Param('bookingId') bookingId: string,
    @Param('newStatus') newStatus: string,
    @Query() query,
  ): Promise<GeneralResponse> {
    return await this.eventBL.updateBooking(
      bookingId,
      newStatus,
      query?.clientDate,
    );
  }

  @Get('bookingsByDocument/:documentNumber')
  async getBookingsByDocument(
    @Param('documentNumber') documentNumber: string,
  ): Promise<BookingS[]> {
    return await this.eventBL.getBookingsByDocument(documentNumber);
  }

  @Get('AllBookingsByDocument/:searchCriteria')
  async getAllBookingsByDocument(
    @Param('searchCriteria') searchCriteria: string,
  ): Promise<Booking[]> {
    return await this.eventBL.getAllBookingsByDocument(searchCriteria);
  }

  @Get('getEventById/:eventId')
  async getEventById(@Param('eventId') eventId: string): Promise<Events> {
    return await this.eventBL.getEventById(eventId);
  }

  @Post('CreateBookingCollection/:eventId/:bookingDate')
  async createBookings(
    @Body() documentNumbers: string[],
    @Param('eventId') eventId: string,
    @Param('bookingDate') bookingDate: string
  ): Promise<BulkLoadResponse[]> {
    return await this.eventBL.createCollection(documentNumbers, eventId, bookingDate);
  }
}
