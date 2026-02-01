import { Module } from '@nestjs/common';
import { FichesTechniquesService } from './fiches-techniques.service';
import { FichesTechniquesController } from './fiches-techniques.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UnitesModule } from '../unites/unites.module';
import { FichesController } from '../fiches/fiches.controller';

@Module({
  imports: [PrismaModule, UnitesModule],
  controllers: [FichesTechniquesController, FichesController],
  providers: [FichesTechniquesService],
  exports: [FichesTechniquesService],
})
export class FichesTechniquesModule {}
