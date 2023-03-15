import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Church, ChurchTextDocument } from 'src/schemas/churches/church.schema';

@Injectable()
export class ChurchProvider {
  constructor(
    @InjectModel(Church.name) private churchModel: Model<ChurchTextDocument>,
  ) {}

  async getAllChurches() {
    return this.churchModel.find()
  }

}
