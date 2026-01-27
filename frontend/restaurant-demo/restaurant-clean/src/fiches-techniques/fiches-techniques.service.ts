// src/fiches-techniques/fiches-techniques.service.ts
import { Injectable } from '@nestjs/common';
import { CreateFicheDto, FicheItem } from './dto/create-fiche.dto';

@Injectable()
export class FichesTechniquesService {
  async create(dto: CreateFicheDto) {
    const items: FicheItem[] = Array.isArray(dto.items) ? dto.items : [];

    for (const item of items) {
      const produitId = Number(item.produitId);
      const rendement = item.rendement !== undefined ? Number(item.rendement) : undefined;
      const uniteRdt = item.uniteRdt ?? undefined;

      if (Array.isArray(item.items)) {
        for (const sub of item.items) {
          const ingredientId = Number(sub.ingredientId);
          const quantite = Number(sub.quantite);
          const unite = String(sub.unite);
          // TODO: insérer/upsert en base
        }
      }
    }

    return { success: true };
  }
}
