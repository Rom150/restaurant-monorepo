import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  async parseFile(file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('File missing or not in memory (use memoryStorage).');
    }

    let text = '';

    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      try {
        const data = await pdfParse(file.buffer);
        text = data.text || '';
      } catch (err) {
        text = file.buffer.toString('utf8').slice(0, 2000);
      }
    } else {
      text = `Server-side OCR not enabled for images. File name: ${file.originalname}`;
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const items: Array<any> = [];
    for (const line of lines) {
      const m = line.match(/(.+?)\s+([0-9]+(?:[.,][0-9]+)?)\s*(kg|g|l|ml|unit|unité|pcs|pc)?\s+([0-9]+(?:[.,][0-9]+)?)/i);
      if (m) {
        const name = m[1].trim();
        const quantite = parseFloat(m[2].replace(',', '.'));
        const unite = m[3] ? m[3].toLowerCase() : null;
        const prix = parseFloat(m[4].replace(',', '.'));
        items.push({ name, quantite, unite, prix, confidence: 0.5 });
      } else {
        const m2 = line.match(/(.+?)\s+([0-9]+(?:[.,][0-9]+)?)\s*(€)?$/);
        if (m2) {
          const name = m2[1].trim();
          const prix = parseFloat(m2[2].replace(',', '.'));
          items.push({ name, prix, confidence: 0.3 });
        }
      }
    }

    return {
      items,
      meta: {
        textPreview: lines.slice(0, 80).join('\n'),
        lineCount: lines.length,
        fileName: file.originalname,
      },
    };
  }

  async commitParsed(dto: any, user: any) {
    if (!dto || !Array.isArray(dto.items)) {
      throw new BadRequestException('Invalid payload - items required');
    }

    const created: Array<any> = [];

    for (const it of dto.items) {
      const product = await this.prisma.product.upsert({
        where: { name: it.name },
        update: {
          price: it.prix ?? undefined,
          prixParDefaut: it.prix ?? undefined,
          uniteParDefaut: it.unite ?? undefined,
        },
        create: {
          name: it.name,
          description: null,
          price: it.prix ?? 0,
          prixParDefaut: it.prix ?? 0,
          uniteParDefaut: it.unite ?? 'unit',
        },
      });

      await this.prisma.prix.create({
        data: {
          produitId: product.id,
          montant: it.prix ?? 0,
        },
      });

      created.push({ produitId: product.id, name: product.name });
    }

    if (dto.type === 'fiche' && dto.items.length > 0) {
      const mainProductName = dto.targetProductName || `Fiche ${Date.now()}`;
      const mainProd = await this.prisma.product.upsert({
        where: { name: mainProductName },
        update: {},
        create: { name: mainProductName, price: 0, prixParDefaut: 0, uniteParDefaut: 'unit' },
      });

      const fiche = await this.prisma.ficheTechnique.upsert({
        where: { produitId: mainProd.id },
        update: {},
        create: {
          produitId: mainProd.id,
          rendement: dto.rendement ?? 1,
          uniteRdt: dto.uniteRdt ?? 'unit',
          notes: dto.meta?.note ?? null,
        },
      });

      for (let i = 0; i < dto.items.length; i++) {
        const it = dto.items[i];
        const ingProd = await this.prisma.product.findFirst({ where: { name: it.name } });
        if (!ingProd) continue;
        await this.prisma.ficheIngredient.create({
          data: {
            ficheId: fiche.id,
            ingredientId: ingProd.id,
            quantite: it.quantite ?? 0,
            unite: it.unite ?? 'unit',
            ordre: i + 1,
            notes: it.notes ?? null,
          },
        });
      }
    }

    return { ok: true, created };
  }
}
