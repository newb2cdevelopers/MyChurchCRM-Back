import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { connection } from './configuration';
@Module({
  imports: [
    MongooseModule.forRoot(connection, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }),
  ],
})
export class MongoProviderModule {}
