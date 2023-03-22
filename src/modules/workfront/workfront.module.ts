import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Workfront, WorkfrontSchema } from 'src/schemas/workfronts/workfront.schema';
import { WorkfrontController } from 'src/controllers/workfront/workfront.controller';
import { WorkfrontBusiness } from 'src/business/workfronts/workfront.bl';
import { WorkfrontProvider } from 'src/providers/workfront/workfront.provider';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Workfront.name, schema: WorkfrontSchema }]),
  ],
  controllers: [WorkfrontController],
  providers: [WorkfrontBusiness, WorkfrontProvider],
})
export class WorkfrontModule {}
