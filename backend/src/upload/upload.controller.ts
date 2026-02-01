import { Controller, Post, UploadedFile, UseInterceptors, Options, HttpCode, Body, InternalServerErrorException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { spawnSync } from 'child_process';
import { PrismaService } from '../prisma/prisma.service';

type ParsedItem = {
  raw: string;
  name: string;
  quantite: number;
  unite: string;
  prix: number;
  confidence: number;
};

@Controller('api/upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Options('parse')
  @HttpCode(204)
  optionsParse() {
    return;
  }

  @Post('parse')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async parse(@UploadedFile() file: any) {
    if (!file || !file.buffer) {
      return { error: 'No file buffer received' };
    }

    let text = '';
    try {
      const proc = spawnSync('pdftotext', ['-layout', '-enc', 'UTF-8', '-', '-'], {
        input: file.buffer,
        maxBuffer: 50 * 1024 * 1024,
      });
      if (proc.error) {
        this.logger.error('pdftotext error', String(proc.error));
        return { error: 'pdftotext error', details: String(proc.error), stderr: proc.stderr?.toString() };
      }
      text = proc.stdout ? proc.stdout.toString('utf8') : '';
    } catch (err) {
      this.logger.error('Failed to run pdftotext', err as any);
      return { error: 'Failed to run pdftotext', details: String(err) };
    }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    const isHeaderLine = (ln: string) => {
      const low = ln.toLowerCase();
      const prefixes = ['facture', 'date', 'client', 'produit', 'total', 'adresse', 'tel', 'tél', 'page', 'montant', 'siren'];
      for (const p of prefixes) if (low.startsWith(p)) return true;
      if (/(produit|unité|prix|prix unitaire|quantité)/i.test(ln) && ln.length < 120) return true;
      if (/^\d{5}\s+\p{L}/u.test(ln)) return true; // ex: "75008 Paris"
      if (/^\d+\s+.*\b(rue|avenue|av|bd|boulevard|place|impasse|chemin|allée|allee|route|lot)\b/i.test(ln)) return true;
      if (/^[0-9\-\s]{2,}$/.test(ln)) return true;
      if (/^(facture|fac)[\s\w-]*\d+/i.test(ln)) return true;
      if (/\b\d{1,2}\s+[a-zéû]+\s+\d{4}\b/i.test(ln)) return true; // ex "15 janvier 2026"
      return false;
    };

    const unitTokens = ['kg','g','l','ml','cl','botte','bte','bot','pcs','unité','u','bouteille','paquet','sachet','portion','lot','kg.','l.'];
    const findUnit = (s: string) => {
      for (const u of unitTokens) {
        const re = new RegExp('\\b' + u.replace('.', '\\.') + '\\b', 'i');
        if (re.test(s)) return u.replace('.', '').toLowerCase();
      }
      return null;
    };

    const items: ParsedItem[] = [];

    for (let rawLine of lines) {
      if (!rawLine || rawLine.length < 2) continue;
      if (isHeaderLine(rawLine)) continue;

      let line = rawLine;

      // prix à la fin de ligne
      const priceCandidate = line.match(/([0-9]+(?:[.,][0-9]{1,2})?)\s*(€|eur)?\s*$/i);
      let prix = 0;
      let priceFound = false;
      if (priceCandidate) {
        const hasEuro = /€|eur/i.test(line);
        const hasDecimal = /[0-9]+[.,][0-9]{1,2}/.test(priceCandidate[1]);
        if (hasEuro || hasDecimal) {
          prix = Number(priceCandidate[1].replace(',', '.'));
          priceFound = true;
          line = line.slice(0, priceCandidate.index).trim();
        }
      }

      // quantité/unité
      let quant = 0;
      let unite = '';
      const qtyMatch = line.match(/([0-9]+(?:[.,][0-9]+)?)\s*(kg|g|l|ml|cl|botte|bte|pcs|unité|u|bouteille|paquet|sachet|portion|lot)\b/i);
      if (qtyMatch) {
        quant = Number(qtyMatch[1].replace(',', '.'));
        unite = qtyMatch[2].toLowerCase();
        line = line.replace(qtyMatch[0], '').trim();
      } else {
        const u = findUnit(line);
        if (u) {
          unite = u;
          quant = 1;
          line = line.replace(new RegExp('\\b' + u.replace('.', '\\.') + '\\b', 'i'), '').trim();
        }
      }

      let name = line.replace(/\s{2,}/g, ' ').trim();
      name = name.replace(/[\s\-\:\,]+$/g, '').trim();

      // si ressemble à adresse/numéro, ignore
      if (/^\d+/.test(name) || /\b(rue|avenue|boulevard|place|chemin|route|impasse|allée|allee)\b/i.test(name)) {
        continue;
      }

      let confidence = 0.2;
      if (priceFound && unite) confidence = 0.95;
      else if (priceFound) confidence = 0.8;
      else if (unite) confidence = 0.6;

      if (!name || name.length < 2) continue;

      items.push({
        raw: rawLine,
        name,
        quantite: quant,
        unite: unite || 'unit',
        prix: prix,
        confidence,
      });
    }

    return {
      filename: file.originalname || null,
      size: file.size || 0,
      items,
      raw_text_preview: lines.slice(0, 80),
    };
  }

  /**
   * Persiste les items :
   * - recherche un Product par name (findFirst) — name n'étant pas unique on utilise findFirst
   * - update ou create Product
   * - crée une entrée Prix liée au Product
   */
  @Post('commit')
  async commit(@Body() payload: { items?: ParsedItem[] }) {
    const items = Array.isArray(payload.items) ? payload.items : [];
    const results: any[] = [];

    try {
      for (const it of items) {
        if (!it?.name) continue;
        const name = it.name.trim();

        // chercher produit existant
        let product = await this.prisma.product.findFirst({
          where: { name },
        });

        if (product) {
          product = await this.prisma.product.update({
            where: { id: product.id },
            data: {
              prixParDefaut: it.prix ?? product.prixParDefaut,
              uniteParDefaut: it.unite ?? product.uniteParDefaut,
            },
          });
        } else {
          product = await this.prisma.product.create({
            data: {
              name,
              price: it.prix ?? 0,
              prixParDefaut: it.prix ?? undefined,
              uniteParDefaut: it.unite ?? 'unit',
            },
          });
        }

        // créer la ligne Prix
        const prixEntry = await this.prisma.prix.create({
          data: {
            produitId: product.id,
            montant: it.prix ?? 0,
            devise: 'EUR',
            etablissementId: null,
          },
        });

        results.push({ productId: product.id, prixId: prixEntry.id, name });
      }

      return { status: 'ok', inserted: results.length, results };
    } catch (err) {
      this.logger.error('Failed to persist import', err as any);
      throw new InternalServerErrorException('Failed to persist import');
    }
  }


  @Post('parse-image')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async parseImage(@UploadedFile() file: any) {
    if (!file || !file.buffer) {
      return { error: 'No file buffer received' };
    }
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const tmpPath = path.join(os.tmpdir(), `upload_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
    try {
      fs.writeFileSync(tmpPath, file.buffer);

      const { spawnSync } = require('child_process');
      const proc = spawnSync('tesseract', [tmpPath, 'stdout', '-l', 'fra'], {
        maxBuffer: 50 * 1024 * 1024,
      });
      if (proc.error) {
        return { error: 'tesseract error', details: String(proc.error), stderr: proc.stderr?.toString() };
      }
      const text = proc.stdout ? proc.stdout.toString('utf8') : '';

      const lines = text.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);
      const items: any[] = [];

      for (let rawLine of lines) {
        if (!rawLine || rawLine.length < 2) continue;
        const low = rawLine.toLowerCase();
        if (/(facture|date|client|produit|total|adresse|page|montant|siren)/i.test(low)) continue;

        let line = rawLine;

        // price at end
        const priceCandidate = line.match(/([0-9]+(?:[.,][0-9]{1,2})?)\\s*(€|eur)?\\s*$/i);
        let prix = 0;
        let priceFound = false;
        if (priceCandidate) {
          prix = Number(priceCandidate[1].replace(',', '.'));
          priceFound = true;
          line = line.slice(0, priceCandidate.index).trim();
        }

        // quantity + unit
        let quant = 0;
        let unite = '';
        const qtyMatch = line.match(/([0-9]+(?:[.,][0-9]+)?)\\s*(kg|g|l|ml|cl|botte|bte|pcs|pi[eè]ce|piece|unité|unite|bouteille|paquet|sachet|portion|lot)\\b/i);
        if (qtyMatch) {
          quant = Number(qtyMatch[1].replace(',', '.'));
          unite = qtyMatch[2].toLowerCase();
          line = line.replace(qtyMatch[0], '').trim();
        }

        let name = line.replace(/\\s{2,}/g, ' ').trim();
        name = name.replace(/[\\s\\-\\:\\,]+$/g, '').trim();

        if (!name || name.length < 2) continue;

        let confidence = 0.3;
        if (priceFound && unite) confidence = 0.95;
        else if (priceFound) confidence = 0.8;
        else if (unite) confidence = 0.6;

        items.push({
          raw: rawLine,
          name,
          quantite: quant,
          unite: unite || 'unit',
          prix: prix,
          confidence,
        });
      }

      return {
        filename: file.originalname || null,
        size: file.size || 0,
        items,
        raw_text_preview: lines.slice(0, 80),
      };
    } catch (err) {
      return { error: 'Failed to parse image', details: String(err) };
    } finally {
      try { fs.unlinkSync(tmpPath); } catch (e) {}
    }
  }




  @Post('photo')
  @UseInterceptors(FileInterceptor('file', {
    storage: require('multer').diskStorage({
      destination: (req, file, cb) => {
        const fs = require('fs');
        const path = require('path');
        const dest = path.join(process.cwd(), 'uploads', 'fiches');
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const ext = (file.originalname || '').split('.').pop();
        const name = 'fiche_' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + (ext || 'jpg');
        cb(null, name);
      }
    })
  }))
  async uploadPhoto(@UploadedFile() file: any) {
    if (!file) return { error: 'no file' };
    const url = `/uploads/fiches/${file.filename}`;
    return { url, size: file.size, filename: file.filename };
  }

}