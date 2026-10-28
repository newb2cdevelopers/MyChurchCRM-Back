import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Person, PersonSchema } from 'src/schemas/person/person.schema';
import { PersonProvider } from 'src/providers/person/person.provider';
import { PersonBusiness } from 'src/business/person/person.bl';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }]),
  ],
  providers: [PersonProvider, PersonBusiness],
  exports: [PersonProvider, PersonBusiness, MongooseModule],
})
export class PersonModule {}
