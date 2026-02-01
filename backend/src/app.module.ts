import { UploadModule } from './upload/upload.module';
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

// modules que nous avons ajoutés
import { FichesTechniquesModule } from './fiches-techniques/fiches-techniques.module';
import { UnitesModule } from './unites/unites.module';

@Module({
  imports: [
    UploadModule,
    // Prisma en premier si d'autres modules en dépendent
    PrismaModule,
    UsersModule,
    AuthModule,
    // nos nouveaux modules métier
    FichesTechniquesModule,
    UnitesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
