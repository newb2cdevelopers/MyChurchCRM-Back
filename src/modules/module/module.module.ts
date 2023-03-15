import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Module as ModuleLocal, ModuleSchema } from 'src/schemas/module/module.schema';
import { ModuleController } from 'src/controllers/module/module.controller';
import { ModuleBusiness } from 'src/business/module/module.bl';
import { ModuleProvider } from 'src/providers/module/module.provider';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: ModuleLocal.name, schema: ModuleSchema }]),
  ],
  controllers: [ModuleController],
  providers: [ModuleBusiness, ModuleProvider],
})
export class ModuleLocalModule {}
