import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Church, ChurchSchema } from 'src/schemas/churches/church.schema';
import { ChurchController } from 'src/controllers/church/church.controller';
import { ChurchBusiness } from 'src/business/church/church.bl';
import { ChurchProvider } from 'src/providers/churches/church.provider';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Church.name, schema: ChurchSchema }]),
  ],
  controllers: [ChurchController],
  providers: [ChurchBusiness, ChurchProvider],
})
export class ChurchModule {}
