// src/fiches-techniques/dto/create-fiche.dto.ts
export type FicheItem = {
  produitId: number;
  rendement?: number;
  uniteRdt?: string;
  notes?: string;
  items?: Array<{
    ingredientId: number;
    quantite: number;
    unite: string;
    ordre?: number;
    notes?: string;
  }>;
};

export class CreateFicheDto {
  titre!: string;
  description?: string;
  items!: FicheItem[];
}
