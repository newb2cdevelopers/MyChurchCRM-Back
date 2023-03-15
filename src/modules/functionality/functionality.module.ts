import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Functionality, FunctionalitySchema } from 'src/schemas/functionality/functionality.schema';
import { FunctionalityController } from 'src/controllers/functionality/functionality.controller';
import { FunctionalityBusiness } from 'src/business/functionality/functionality.bl';
import { FunctionalityProvider } from 'src/providers/functionality/functionality.provider';
import { Role, RoleSchema } from 'src/schemas/roles/role.schema';
import { Module as ModuleSystem, ModuleSchema } from 'src/schemas/module/module.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Functionality.name, schema: FunctionalitySchema }]),
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
    MongooseModule.forFeature([{ name: ModuleSystem.name, schema: ModuleSchema }]),
  ],
  controllers: [FunctionalityController],
  providers: [FunctionalityBusiness, FunctionalityProvider],
})
export class FunctionalityModule {}
