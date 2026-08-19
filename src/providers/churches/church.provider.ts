import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Church, ChurchTextDocument } from 'src/schemas/churches/church.schema';
import { ChurchServiceDto } from 'src/schemas/churches/church.DTO';

@Injectable()
export class ChurchProvider {
  constructor(
    @InjectModel(Church.name) private churchModel: Model<ChurchTextDocument>,
  ) {}

  async getAllChurches() {
    return this.churchModel.find();
  }

  async getById(churchId: string): Promise<ChurchTextDocument | null> {
    return this.churchModel.findById(churchId);
  }

  async updateServices(
    churchId: string,
    services: ChurchServiceDto[],
  ): Promise<ChurchTextDocument | null> {
    return this.churchModel.findByIdAndUpdate(
      churchId,
      { $set: { services } },
      { new: true },
    );
  }
}
