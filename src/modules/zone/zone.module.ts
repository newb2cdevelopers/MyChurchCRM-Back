import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Zone, ZoneSchema } from 'src/schemas/zone/zone.schema';
import { ZoneController } from 'src/controllers/zone/zone.controller';
import { ZoneBusiness } from 'src/business/zone/zone.bl';
import { ZoneProvider } from 'src/providers/zone/zone.provider';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Zone.name, schema: ZoneSchema }]),
  ],
  controllers: [ZoneController],
  providers: [ZoneBusiness, ZoneProvider],
})
export class ZoneModule {}
