import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UniteService } from './unite.service';

@Module({
  imports: [PrismaModule],
  providers: [UniteService],
  exports: [UniteService],
})
export class UnitesModule {}
