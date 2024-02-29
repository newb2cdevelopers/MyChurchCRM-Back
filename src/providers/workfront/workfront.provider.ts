import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workfront, WorkfrontDocument } from 'src/schemas/workfronts/workfront.schema';
import { Users, UserDocument } from 'src/schemas/user/user.schema';
import { GeneralResponse } from 'src/dtos/genericResponse.dto';
import { WorkfrontAssignment, UserAssignment, WorkfrontDto } from 'src/dtos/workfronts';

@Injectable()
export class WorkfrontProvider {
  constructor(
    @InjectModel(Workfront.name) private workfrontModel: Model<WorkfrontDocument>,
    @InjectModel(Users.name) private usertModel: Model<UserDocument>,
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

  async saveAssignment(workfrontId: string, users: string[]) : Promise<GeneralResponse> {

    console.log(workfrontId, users);
    
    try {

      await this.usertModel.updateMany({
        "_id": { "$in": users } 
      }, {"$set":{"workfront": workfrontId}});

      const response: GeneralResponse = {
        isSuccessful: true
      }

      return response;

    } catch (error) {
      throw new InternalServerErrorException("Hubo un error guardando la asignación")
    }
  
  }


  async getWorkFrontAssignmentData(churchId: string): Promise<GeneralResponse> {

    const frontsByChurch =  await this.workfrontModel.find({churchId: churchId})
    const userByChurch = await this.usertModel.find({churchId: churchId}).populate<{workfront: Workfront }>("workfront")

    const response: WorkfrontAssignment =  {
      Users : userByChurch.map(user => {

        const mappedUser: UserAssignment = {
          Name: user.name + " " + user.lastName,
          Id: user._id,
          CurrentWorkfront: user.workfront?.name
        }

        return mappedUser;
      }),

      Worfronts: frontsByChurch.map(front => {
        const mappedFront: WorkfrontDto = {
          Id: front._id,
          Name: front.name
        }

        return mappedFront;
      })
    };

    return  {
      isSuccessful: true,
      data: response
    };
  }
  
}
