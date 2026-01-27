// src/unites/unite.service.ts
import { Injectable } from '@nestjs/common';
import { CreateUniteDto } from './dto/create-unite.dto';

@Injectable()
export class UniteService {
  create(dto: CreateUniteDto) {
    const name = String(dto.name);
    const type = String(dto.type ?? 'count');
    const precision = Number.isFinite(Number(dto.precision)) ? Number(dto.precision) : 0;

    return { id: 1, name, type, precision };
  }
}
