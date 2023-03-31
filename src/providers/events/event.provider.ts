import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventDTO, CreateEventDTO } from 'src/schemas/events/event.DTO';
import { Events, EventDocument } from 'src/schemas/events/event.shema';
import { Booking } from 'src/schemas/events/Boooking.type';
import { nanoid } from 'nanoid';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { Booking as BookingS, BookingDocument } from 'src/schemas/bookings/booking.schema';
import { Attendee, AttendeeTextDocument } from 'src/schemas/attendee/attendee.schema';
import { BulkLoadResponse } from 'src/dtos/BulkLoadResponse';

@Injectable()
export class EventProvider {
  constructor(
    @InjectModel(Events.name) private eventModel: Model<EventDocument>, @InjectModel(BookingS.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Attendee.name) private attendeeModel: Model<AttendeeTextDocument>
  ) {}

  async newEvent(event: EventDTO) {
    return this.eventModel.create(event);
  }

  async getAll() {
    return this.eventModel.find().populate('user').populate('churchId').populate({
      path: "Bookings",
      model: 'Booking',
      populate: {
        path: "atendee",
        model: "Attendee"
      }
    });
  }

  //get by church id
  async getByChurchId(churchId: string) {
    return this.eventModel
      .find({
        churchId: churchId,
      })
      .populate('user')
      .populate('churchId')
      .populate({
        path: "Bookings",
        model: 'Booking',
        populate: {
          path: "atendee",
          model: "Attendee"
        }
      })

  }

  async addBooking(newBooking: CreateEventDTO, eventId: string) {
    const isExisting = await this.hasExistingBooking(
      newBooking.atendee,
      eventId,
    );

    if (!isExisting) {
      const mappedBooking = {
        ...newBooking,
        eventId: eventId,
        status: 'Pendiente'
      };

      const createdBooking = await this.bookingModel.create(mappedBooking);

      try {
        await this.eventModel.updateOne(
          {
            _id: eventId,
          },
          {
            $push: { Bookings: createdBooking._id },
          },
          {
            new: true,
          },
        );

        return this.eventModel.findOne({
          _id: eventId,
        }).populate({
          path: "Bookings",
          model: 'Booking',
          populate: {
            path: "atendee",
            model: "Attendee"
          }
        });

      } catch (error) {
        console.log(error);
        
      }
    
    }

    return this.eventModel.find({
      _id: eventId,
    });
  }

  async hasExistingBooking(
    attendeeId: string,
    eventId: string,
  ): Promise<boolean> {

    const attendee = await this.attendeeModel.findById(attendeeId);

    if (!attendee) {
      return false;
    }

    const existingBooking = await this.bookingModel.findOne({
      atendee: attendeeId,
      eventId: eventId
    });

    if (existingBooking) {
      return true;
    }

    return false;
  }

  async updateBooking(
    bookingId: string,
    newStatus: string,
  ): Promise<GeneralResponse> {
    let response: GeneralResponse = { isSuccessful: true };

    const existingEvent = await this.eventModel.findOne(
      {
        'Bookings': {$in : bookingId}
      }
    );

    if (existingEvent) {
      
      try {
        const existingBooking =  await this.bookingModel.findById(bookingId);

        if (existingBooking && existingBooking.status === newStatus ) {
          response.message = `La reserva ya se encuentra en el estado: ${newStatus}`;
          response.isSuccessful = false;
          return response;
        }

        await this.bookingModel.updateOne(
          {
            _id: bookingId,
          },
          {
            $set: {
              'status': newStatus,
            },
          },
        );

        return response;
      } catch (error) {
        console.log(error);
        response.isSuccessful = false;
        response.message =
          'No se pudo consultar la reserva, contacte al administrador.';
        return response;
      }
    }

    response.isSuccessful = false;
    response.message = 'No se pudo encontrar la reserva especificada. Contacte al administrador';
    return response;
  }

 async getEventByBookingId (bookingId:string): Promise<Events> {
  const existingEvent = await this.eventModel.findOne({
    'Bookings': {$in : bookingId},
  });
  
  return existingEvent;
 }
  async updateEvent(eventId: string, updateEvent: EventDTO): Promise<boolean> {
    const existingEvent = await this.eventModel.findOne({
      _id: eventId,
    });

    if (existingEvent) {
      try {
        await this.eventModel.updateOne(
          {
            _id: eventId,
          },
          {
            $set: {
              status: updateEvent.status,
              capacity: updateEvent.capacity,
              name: updateEvent.name,
              date: updateEvent.date,
              time: updateEvent.time,
              isBookingAvailable: updateEvent.isBookingAvailable,
            },
          },
        );
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    }

    return false;
  }

  async getBookingsByDocument(documentNumber: string): Promise<BookingS[]> {

    const existingAttendee =  await this.attendeeModel.findOne({
      documentNumber: documentNumber
    });

    if (!existingAttendee) {
      return []
    }

    const bookingsQuery = await this.bookingModel.find(
      {
        atendee : existingAttendee._id,
        status: 'Pendiente'
      }).populate("eventId").populate("atendee");

      return bookingsQuery;
  }

  async getAllBookingsByDocument(documentNumber: string): Promise<BookingS[]> {

    const existingAttendee =  await this.attendeeModel.findOne({
      documentNumber: documentNumber
    });

    if (!existingAttendee) {
      return []
    }

    const bookingsQuery = await this.bookingModel.find(
      {
        atendee : existingAttendee._id,
      }).populate("eventId").populate("atendee");

      return bookingsQuery;
  }

  async getEventById(eventId: string): Promise<Events> {
    const event = await this.eventModel.findOne({
      _id: eventId,
    }).populate({
      path: "Bookings",
      model: 'Booking',
      populate: {
        path: "atendee",
        model: "Attendee"
      }
    });

    if (event) {
      return event;
    }

    return new Events();
  }

  async createCollection(documentNumbers: string[], eventId:string, bookingDate: string) {
    
    const existingEvent =  await this.eventModel.findById(eventId);

    if (!existingEvent) {
      return [
        {
          idEntity :null,
          isSaved : false,
          message :`El evento no es válido`
        }
      ]
    };
    
    let bulkResponse = await Promise.all(
      documentNumbers.map(async (documentNumber, index) => {
        let itemResponse: BulkLoadResponse = {
          idEntity: '',
          isSaved: false,
        };

        let attendee = await this.attendeeModel.findOne({
          documentNumber: documentNumber,
        });

        if (!attendee) {
          itemResponse.idEntity = null;
          itemResponse.isSaved = false;
          itemResponse.message = `Usuario con cédula:${documentNumber} no se encuentra registrado`;
        } else {

            const hasReservation = await this.bookingModel.findOne({
              atendee: attendee._id,
              eventId: eventId
            });

            if (hasReservation) {
              itemResponse.idEntity = null;
              itemResponse.isSaved = false;
              itemResponse.message = `Usuario con cédula:${documentNumber} ya tiene reserva para este evento`;
            }else{

              try {
                const newBooking = await this.bookingModel.create({
                  bookingDate: bookingDate,
                  atendee: attendee._id,
                  eventId: eventId,
                  status: 'Pendiente'
              });

              await this.eventModel.updateOne(
                {
                  _id: eventId,
                },
                {
                  $push: { Bookings: newBooking._id },
                },
                {
                  new: true,
                },
              );

              
              itemResponse.idEntity = newBooking._id;
              itemResponse.isSaved = true;

              } catch (error) {
                itemResponse.isSaved = false;
                itemResponse.message = `Se ha presentado un error creando la reserva para  ${documentNumber} ${error}`;
              }
            }
        }

        return itemResponse;
      }),
    );

    return bulkResponse;
  }
}
