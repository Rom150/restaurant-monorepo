// src/fiches-techniques/fiches-techniques.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFicheDto, FicheItem } from './dto/create-fiche.dto';

@Injectable()
export class FichesTechniquesService {
  // create : déjà présent, conservé/complété si besoin
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

  // --- méthodes ajoutées pour satisfaire le contrôleur ---

  // retourne la liste (stub). Remplace par accès DB réel.
  async findAll(): Promise<any[]> {
    // TODO: remplacer par récupération réelle depuis la DB
    return [];
  }

  // retourne une fiche par id (stub)
  async findOne(id: number): Promise<any | null> {
    // TODO: remplacer par récupération réelle depuis la DB
    // Exemple : return await this.prisma.ficheTechnique.findUnique({ where: { id }});
    return { id, nom: `fiche-${id}`, items: [] };
  }

  // met à jour une fiche (stub)
  async update(id: number, dto: Partial<CreateFicheDto>): Promise<any> {
    // TODO: remplacer par update réel en base
    return { success: true, id, updated: dto };
  }

  // supprime une fiche (stub)
  async remove(id: number): Promise<any> {
    // TODO: remplacer par suppression réelle en base
    return { success: true, id };
  }

  /**
   * calculerCout
   * - accepte soit un etablissementId (number), soit un objet d'options { withTaxes?: boolean }.
   * - appelé par le contrôleur avec: calculerCout(Number(id), etablissementId ? Number(etablissementId) : undefined)
   */
  async calculerCout(
    id: number,
    etablissementIdOrOptions?: number | { withTaxes?: boolean },
  ): Promise<{ cout: number }> {
    let etablissementId: number | undefined = undefined;
    let withTaxes: boolean | undefined = undefined;

    if (typeof etablissementIdOrOptions === 'number') {
      etablissementId = etablissementIdOrOptions;
    } else if (typeof etablissementIdOrOptions === 'object' && etablissementIdOrOptions) {
      withTaxes = etablissementIdOrOptions.withTaxes;
    }

    // TODO: effectuer le calcul réel du coût : récupérer la fiche, récupérer prix des produits,
    // appliquer rendements, appliquer taxes si withTaxes true, etc.
    // Pour le moment on renvoie un stub neutre.
    return { cout: 0 };
  }
}
