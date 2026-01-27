import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Neighborhood, NeighborhoodSchema } from 'src/schemas/neighborhood/neighborhood.schema';
import { NeighborhoodController } from 'src/controllers/neighborhood/neighborhood.controller';
import { NeighborhoodBusiness } from 'src/business/neighborhood/neighborhood.bl';
import { NeighborhoodProvider } from 'src/providers/neighborhood/neighborhood.provider';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Neighborhood.name, schema: NeighborhoodSchema }]),
  ],
  controllers: [NeighborhoodController],
  providers: [NeighborhoodBusiness, NeighborhoodProvider],
})
export class NeighborhoodModule {}
