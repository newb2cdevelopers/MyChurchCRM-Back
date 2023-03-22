import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workfront, WorkfrontDocument } from 'src/schemas/workfronts/workfront.schema';

@Injectable()
export class WorkfrontProvider {
  constructor(
    @InjectModel(Workfront.name) private workfrontModel: Model<WorkfrontDocument>,
  ) {}

  async getAllWorkfronts() {
    return this.workfrontModel.find()
  }

  async getAllWorkfrontsByChurch(churchId: string) {
    return this.workfrontModel.find({churchId: churchId})
  }

  async create(workfront: Workfront) {
    return this.workfrontModel.create(workfront);
  }

}
