import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Neighborhood, NeighborhoodTextDocument } from 'src/schemas/neighborhood/neighborhood.schema';

@Injectable()
export class NeighborhoodProvider {
  constructor(
    @InjectModel(Neighborhood.name) private neighborhoodModel: Model<NeighborhoodTextDocument>,
  ) {}

  async getAllNeighborhoods() {
    return this.neighborhoodModel.find().populate("locality")
  }

  async CreateNeighborhood(newNeighborhood : Neighborhood ) {
    return this.neighborhoodModel.create(newNeighborhood)
  }
}
