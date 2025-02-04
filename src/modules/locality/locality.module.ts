import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Locality, LocalitySchema } from 'src/schemas/locality/locality.schema';
import { LocalityController } from 'src/controllers/locality/locality.controller';
import { LocalityBusiness } from 'src/business/locality/locality.bl';
import { LocalityProvider } from 'src/providers/locality/locality.provider';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Locality.name, schema: LocalitySchema }]),
  ],
  controllers: [LocalityController],
  providers: [LocalityBusiness, LocalityProvider],
})
export class LocalityModule {}
