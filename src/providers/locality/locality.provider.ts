import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Locality, LocalityTextDocument } from 'src/schemas/locality/locality.schema';

@Injectable()
export class LocalityProvider {
  constructor(
    @InjectModel(Locality.name) private localityModel: Model<LocalityTextDocument>,
  ) {}

  async getAllLocalitys() {
    return this.localityModel.find().populate("zone")
  }

  async CreateLocality(newLocality : Locality ) {
    return this.localityModel.create(newLocality)
  }
}
