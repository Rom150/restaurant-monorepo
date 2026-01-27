export class CommitUploadDto {
  items!: Array<{
    name: string;
    quantite?: number;
    unite?: string;
    prix?: number;
    notes?: string;
  }>;
  type?: 'mercuiale' | 'fiche' | 'inventory';
  meta?: any;
  targetProductName?: string;
  rendement?: number;
  uniteRdt?: string;
}
