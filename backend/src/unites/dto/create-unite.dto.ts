export class CreateUniteDto {
  // champs acceptés par le code existant
  name?: string;      // anglais
  nom?: string;       // FR alternatif
  abrv?: string;
  type?: string;      // ex: 'count' | 'mass' ...
  precision?: number; // nombre de décimales
}
