import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { FichesTechniquesService } from './fiches-techniques.service';
import { CreateFicheDto } from './dto/create-fiche.dto';
import { UpdateFicheDto } from './dto/update-fiche.dto';

@Controller('fiches-techniques')
export class FichesTechniquesController {
  constructor(private service: FichesTechniquesService) {}

  @Post()
  create(@Body() dto: CreateFicheDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFicheDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }

  @Get(':id/cout')
  calculerCout(
    @Param('id') id: string,
    @Query('etablissementId') etablissementId?: string,
  ) {
    return this.service.calculerCout(
      Number(id),
      etablissementId ? Number(etablissementId) : undefined,
    );
  }
}
