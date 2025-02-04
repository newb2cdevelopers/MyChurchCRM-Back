import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Zone, ZoneTextDocument } from 'src/schemas/zone/zone.schema';

@Injectable()
export class ZoneProvider {
  constructor(
    @InjectModel(Zone.name) private zoneModel: Model<ZoneTextDocument>,
  ) {}

  async getAllZones() {
    return this.zoneModel.find().populate("coordinators")
  }

  async CreateZone(newZone : Zone ) {
    return this.zoneModel.create(newZone)
  }
}
