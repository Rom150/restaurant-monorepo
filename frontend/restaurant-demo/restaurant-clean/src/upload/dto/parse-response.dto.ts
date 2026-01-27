export class ParseItemDto {
  name!: string;
  quantite?: number;
  unite?: string;
  prix?: number;
  confidence?: number;
}

export class ParseResponseDto {
  items!: ParseItemDto[];
  meta!: { textPreview?: string; fileName?: string; lineCount?: number };
}
