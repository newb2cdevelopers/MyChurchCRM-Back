import { Injectable } from '@nestjs/common';
import { Events } from 'src/schemas/events/event.shema';
import { Booking as BookingS, BookingDocument } from 'src/schemas/bookings/booking.schema';
import { EventProvider } from 'src/providers/events/event.provider';
import { EventDTO, CreateEventDTO } from 'src/schemas/events/event.DTO';
import { Booking } from 'src/schemas/events/Boooking.type';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { getFormatedDate } from 'src/utilities/dateUtils';
import { BulkLoadResponse } from 'src/dtos/BulkLoadResponse';

@Injectable()
export class EventBusiness {
  constructor(private readonly provider: EventProvider) {}

  async createEvent(event: EventDTO): Promise<Events> {
    return this.provider.newEvent(event) as unknown as Promise<Events>;
  }

  async getAll(): Promise<Events[]> {
    return this.provider.getAll() as unknown as Promise<Events[]>;
  }

  async getByChurchId(churchId: string): Promise<Events[]> {
    return this.provider.getByChurchId(churchId) as unknown as Promise<Events[]>;
  }

  async addBooking(newBooking: CreateEventDTO, eventId: string): Promise<Events> {
    return this.provider.addBooking(newBooking, eventId) as unknown as Promise<Events>;
  }

  getNewTime(currentTime){
    //[0,1,2,3,4,5,6,7,8,9,10,12,13,14,15,16,17,18,19,20,21,22,23];
    let test = currentTime - 5;
    
  }

  async updateBooking(bookingId:string, newStatus:string, clientDate:string): Promise<GeneralResponse> {

    const response: GeneralResponse = { isSuccessful: false };

    if(clientDate && clientDate !== ""){
      const existingEvent = await this.provider.getEventByBookingId(bookingId);
      if(!existingEvent){
        response.message = "No se encontró la reserva";
        return response;
      }
      const eventTime = existingEvent.time
      const eventDate = getFormatedDate(existingEvent.date)
      const todayDate = clientDate.split("T")[0];
      const todayTime = clientDate.split("T")[1];


      if(todayDate === eventDate){
        const currentTime = parseInt(todayTime.substring(0,2));
        const timeEvent = parseInt(eventTime.substring(0,2));
        const timeDifference = currentTime - timeEvent;
        if(timeDifference === 1 || timeDifference === -1 || timeDifference === 0){
          return this.provider.updateBooking(bookingId, newStatus) as unknown as Promise<GeneralResponse>;
        }
      }

      response.message = "Solo se puede confirmar una hora antes o después del evento";
      return response;
    }
    return this.provider.updateBooking(bookingId, newStatus) as unknown as Promise<GeneralResponse>;
  }

  async updateEvent(eventId:string, updateEvent:EventDTO): Promise<boolean> {
    return this.provider.updateEvent(eventId, updateEvent) as unknown as Promise<boolean>;
  }

  async getBookingsByDocument(documentNumber:string): Promise<BookingS[]> {
    return this.provider.getBookingsByDocument(documentNumber) as unknown as Promise<BookingS[]>;
  }

  async getAllBookingsByDocument(documentNumber:string): Promise<Booking[]> {
    return this.provider.getAllBookingsByDocument(documentNumber) as unknown as Promise<Booking[]>;
  }

  async getEventById(eventId:string) : Promise<Events> {
    return this.provider.getEventById(eventId) as unknown as Promise<Events>;
  }

  async createCollection(
    documentNumbers: string[],
    eventId: string,
    bookingDate: string
  ): Promise<BulkLoadResponse[]> {
    return this.provider.createCollection(documentNumbers, eventId, bookingDate) as unknown as Promise<
      BulkLoadResponse[]
    >;
  }
}
