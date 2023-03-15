import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AttendeeDTO } from 'src/schemas/attendee/attendee.DTO';
import {
  Attendee,
  AttendeeTextDocument,
} from 'src/schemas/attendee/attendee.schema';
import { BulkLoadResponse } from 'src/dtos/BulkLoadResponse';

@Injectable()
export class AttendeeProvider {
  constructor(
    @InjectModel(Attendee.name)
    private attendeeModel: Model<AttendeeTextDocument>,
  ) {}

  async getAllAttendee() {
    return this.attendeeModel.find();
  }

  async getAllAttendeeByDocumentNumber(documentNumber: string) {
    return this.attendeeModel.findOne({
      documentNumber: documentNumber,
    });
  }

  async create(attendee: AttendeeDTO) {
    return this.attendeeModel.create(attendee);
  }

  async update(atendeeId: string, updatedAtendee: AttendeeDTO): Promise<boolean> {
    const existingAtendee = await this.attendeeModel.findOne({
      _id: atendeeId,
    });

    if (existingAtendee) {
      try {
        await this.attendeeModel.updateOne(
          {
            _id: atendeeId,
          },
          {
            $set: {
              atendeeSpouse: updatedAtendee.atendeeSpouse,
              birthDate: updatedAtendee.birthDate,
              email: updatedAtendee.email,
              emergencyContactName: updatedAtendee.emergencyContactName,
              emergencyContactPhone: updatedAtendee.emergencyContactPhone,
              name: updatedAtendee.name,
              phone: updatedAtendee.phone,
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

  async createCollection(attendees: AttendeeDTO[]) {
    let time1 = new Date();
    console.log(time1);

    let bulkResponse = await Promise.all(
      attendees.map(async (attendeeItem, index) => {
        let itemResponse: BulkLoadResponse = {
          idEntity: '',
          isSaved: false,
        };

        let attendee = await this.attendeeModel.findOne({
          documentNumber: attendeeItem.documentNumber,
        });

        if (attendee) {
          itemResponse.idEntity = attendee._id;
          itemResponse.isSaved = false;
          itemResponse.message = `Usuario con cédula:${attendeeItem.documentNumber} ya se encuentra registrado`;
        } else {
          try {
            let newAttendee = await this.attendeeModel.create(attendeeItem);
            itemResponse.idEntity = newAttendee._id;
            itemResponse.isSaved = true;
          } catch (error) {
            itemResponse.isSaved = false;
            itemResponse.message = `Se ha presentado un error en la carga de esta persona ${attendeeItem.documentNumber} ${error}`;
          }
        }

        return itemResponse;
      }),
    );

    let time2 = new Date();
    console.log(time2);

    return bulkResponse;
  }
}
