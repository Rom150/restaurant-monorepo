import {
  Body,
  Controller,
  HttpCode,
  InternalServerErrorException,
  Logger,
  Options,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { spawnSync } from 'child_process';
import { PrismaService } from '../prisma/prisma.service';
import * as vision from '@google-cloud/vision';

type ParsedItem = {
  raw: string;
  name: string;
  quantite: number;
  unite: string;
  prix: number; // prix unitaire
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

  // ----------------------------
  // Helpers
  // ----------------------------

  private normalizeSpaces(s: string) {
    return (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private isSummaryLine(ln: string) {
    const low = ln.toLowerCase();
    return (
      /\b(total|tva|ttc|ht)\b/.test(low) ||
      /\bmontant\b/.test(low) ||
      /\bà payer\b/.test(low) ||
      /\bsous[-\s]?total\b/.test(low)
    );
  }

  private isHeaderLine(ln: string) {
    const low = ln.toLowerCase();
    const prefixes = [
      'facture',
      'date',
      'client',
      'produit',
      'total',
      'adresse',
      'tel',
      'tél',
      'page',
      'montant',
      'siren',
      'siret',
      'fournisseur',
    ];
    for (const p of prefixes) if (low.startsWith(p)) return true;
    if (/(produit|unité|prix|prix unitaire|quantité)/i.test(ln) && ln.length < 120) return true;
    if (/^\d{5}\s+\p{L}/u.test(ln)) return true; // ex: "75008 Paris"
    if (/^\d+\s+.*\b(rue|avenue|av|bd|boulevard|place|impasse|chemin|allée|allee|route|lot)\b/i.test(ln))
      return true;
    if (/^[0-9\-\s]{2,}$/.test(ln)) return true;
    if (/^(facture|fac)[\s\w-]*\d+/i.test(ln)) return true;
    if (/\b\d{1,2}\s+[a-zéû]+\s+\d{4}\b/i.test(ln)) return true; // ex "15 janvier 2026"
    return false;
  }

  private parseQtyUnit(s: string): { quantite: number; unite: string } | null {
    const m = s.match(/^\s*([0-9]+(?:[.,][0-9]+)?)\s*(kg|g|l|ml|cl|botte|bte|bot|pcs|pi[eè]ce|piece|unité|unite|u|bouteille|paquet|sachet|portion|lot)\b/i);
    if (!m) return null;
    return { quantite: Number(m[1].replace(',', '.')), unite: m[2].toLowerCase().replace('unite', 'unité') };
  }

  private parseEuroOnly(s: string): number | null {
    // accepte "1,30 €" ou "13,00" etc
    const m = s.match(/^\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*(€|eur)?\s*$/i);
    if (!m) return null;
    // Heuristique: si pas de € mais 1-2 décimales OK quand même
    const hasEuro = /€|eur/i.test(s);
    const hasDecimal = /[0-9]+[.,][0-9]{1,2}/.test(m[1]);
    if (!hasEuro && !hasDecimal) return null;
    return Number(m[1].replace(',', '.'));
  }

  private looksLikeProductName(ln: string) {
    const s = this.normalizeSpaces(ln);
    if (!s || s.length < 2) return false;
    if (this.isHeaderLine(s)) return false;
    if (this.isSummaryLine(s)) return false;
    // évite adresses / num / téléphone
    if (/^\d+/.test(s)) return false;
    if (/\b(rue|avenue|boulevard|place|chemin|route|impasse|allée|allee)\b/i.test(s)) return false;
    // évite "Produit", "Quantité", etc
    if (/(produit|quantité|prix|total)/i.test(s) && s.length < 40) return false;
    return true;
  }

  /**
   * Parser "table" robuste :
   * - repère une zone "Produit / Quantité / Prix unitaire / Total"
   * - lit en séquence: Nom -> Qty -> Euro(s)
   * - ignore les lignes de résumé (Total/TVA/etc) sans perdre l'item en cours (ex: Facture 2)
   */
  private parseAsTable(lines: string[]): ParsedItem[] {
    // détecte si on a un header de table
    const joined = lines.slice(0, 80).join('\n').toLowerCase();
    const looksTable =
      joined.includes('prix unitaire') &&
      joined.includes('quantité') &&
      joined.includes('total') &&
      joined.includes('produit');

    if (!looksTable) return [];

    // on prend une fenêtre de lignes après "Produit"
    const idxProduit = lines.findIndex(l => l.toLowerCase() === 'produit');
    const tableZone = idxProduit >= 0 ? lines.slice(idxProduit + 1) : lines;

    const items: ParsedItem[] = [];

    let currentName: string | null = null;
    let currentQty: { quantite: number; unite: string } | null = null;
    let euros: number[] = [];

    const commitIfReady = () => {
      if (!currentName || !currentQty || euros.length === 0) return;

      // Si on a 2 montants, on choisit le plus petit comme prix unitaire (souvent)
      // Ex: 9,50 et 114,00 -> unit=9,50
      let unit = euros[0];
      if (euros.length >= 2) {
        const a = euros[0];
        const b = euros[1];
        unit = Math.min(a, b);
      }

      items.push({
        raw: `${currentName} | ${currentQty.quantite} ${currentQty.unite} | ${unit} €`,
        name: currentName,
        quantite: currentQty.quantite,
        unite: currentQty.unite,
        prix: unit,
        confidence: 0.98,
      });

      // reset pour le prochain item
      currentName = null;
      currentQty = null;
      euros = [];
    };

    for (const ln0 of tableZone) {
      const ln = this.normalizeSpaces(ln0);
      if (!ln) continue;

      // ignore lignes résumé sans casser l'item courant
      if (this.isSummaryLine(ln) || this.isHeaderLine(ln)) {
        continue;
      }

      const q = this.parseQtyUnit(ln);
      if (q) {
        currentQty = q;
        continue;
      }

      const e = this.parseEuroOnly(ln);
      if (e !== null) {
        euros.push(e);
        // on commit quand on a (name + qty + au moins 1 euro).
        // mais si on a 2 euros (unitaire + total), encore mieux.
        if (currentName && currentQty && euros.length >= 1) {
          // si on a déjà 2 euros: commit direct
          if (euros.length >= 2) {
            commitIfReady();
          }
        }
        continue;
      }

      // si ça ressemble à un nom produit :
      if (this.looksLikeProductName(ln)) {
        // si on change de produit alors que le précédent était prêt avec 1 euro, on commit quand même
        // (certains fournisseurs n'ont pas le total par ligne)
        if (currentName && currentQty && euros.length >= 1) {
          commitIfReady();
        }

        currentName = ln;
        currentQty = null;
        euros = [];
        continue;
      }
    }

    // commit final si resté en attente
    if (currentName && currentQty && euros.length >= 1) {
      commitIfReady();
    }

    return items;
  }

  private parseAsLooseLines(lines: string[]): ParsedItem[] {
    const unitTokens = [
      'kg',
      'g',
      'l',
      'ml',
      'cl',
      'botte',
      'bte',
      'bot',
      'pcs',
      'unité',
      'u',
      'bouteille',
      'paquet',
      'sachet',
      'portion',
      'lot',
      'kg.',
      'l.',
    ];

    const findUnit = (s: string) => {
      for (const u of unitTokens) {
        const re = new RegExp('\\b' + u.replace('.', '\\.') + '\\b', 'i');
        if (re.test(s)) return u.replace('.', '').toLowerCase();
      }
      return null;
    };

    const items: ParsedItem[] = [];

    for (const rawLine0 of lines) {
      const rawLine = this.normalizeSpaces(rawLine0);
      if (!rawLine || rawLine.length < 2) continue;
      if (this.isHeaderLine(rawLine)) continue;
      if (this.isSummaryLine(rawLine)) continue;

      let line = rawLine;

      // prix à la fin
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

      // qty + unit
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
      name = name.replace(/[\s\-:\,]+$/g, '').trim();

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

    return items;
  }

  /**
   * OCR PDF scanné (page 1) via:
   * - pdftoppm (poppler) => PNG
   * - Google Vision documentTextDetection sur l'image
   */
  private async ocrPdfFirstPageWithVision(pdfBuffer: Buffer): Promise<string> {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdfocr_'));
    const pdfPath = path.join(tmpDir, 'input.pdf');
    const outPrefix = path.join(tmpDir, 'page');

    fs.writeFileSync(pdfPath, pdfBuffer);

    // -singlefile => page.png (sans -1)
    const proc = spawnSync('pdftoppm', ['-png', '-f', '1', '-l', '1', '-singlefile', pdfPath, outPrefix], {
      maxBuffer: 200 * 1024 * 1024,
    });

    if (proc.error) {
      throw new Error(`pdftoppm error: ${String(proc.error)}`);
    }
    if (proc.status !== 0) {
      throw new Error(`pdftoppm failed: ${proc.stderr?.toString?.() || 'unknown'}`);
    }

    const pngPath = `${outPrefix}.png`;
    if (!fs.existsSync(pngPath)) {
      throw new Error('pdftoppm did not produce png');
    }

    const client = new vision.ImageAnnotatorClient();
    const [result] = await client.documentTextDetection(pngPath);
    const text = result.fullTextAnnotation?.text || '';

    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}

    return text;
  }

  // ----------------------------
  // Routes
  // ----------------------------

  @Post('parse')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async parse(@UploadedFile() file: any) {
    if (!file || !file.buffer) {
      return { error: 'No file buffer received' };
    }

    this.logger.log(`parse() upload: name=${file.originalname} size=${file.size}`);

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

    // Fallback OCR si quasi vide (PDF scanné)
    if (text.trim().length < 50) {
      this.logger.warn('pdftotext empty -> trying vision OCR on first page (pdftoppm + vision)');
      try {
        text = await this.ocrPdfFirstPageWithVision(file.buffer);
        this.logger.log(`vision pdf ocr len=${text.length}`);
      } catch (e: any) {
        this.logger.error('vision pdf ocr failed', e);
        return { error: 'vision pdf ocr failed', details: String(e?.message || e) };
      }
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => this.normalizeSpaces(l))
      .filter(Boolean);

    // 1) tente parser table (factures “Produit/Quantité/Prix unitaire/Total”)
    const tableItems = this.parseAsTable(lines);
    if (tableItems.length >= 2) {
      return {
        filename: file.originalname || null,
        size: file.size || 0,
        parser: 'table',
        items: tableItems,
        raw_text_preview: lines.slice(0, 120),
      };
    }

    // 2) fallback parser “lignes”
    const items = this.parseAsLooseLines(lines);

    return {
      filename: file.originalname || null,
      size: file.size || 0,
      parser: 'default',
      items,
      raw_text_preview: lines.slice(0, 120),
    };
  }

  /**
   * Persiste les items :
   * - recherche un Product par name (findFirst)
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

        let product = await this.prisma.product.findFirst({ where: { name } });

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

      const client = new vision.ImageAnnotatorClient();
      const [result] = await client.documentTextDetection(tmpPath);
      const text = result.fullTextAnnotation?.text || '';

      if (!text.trim()) {
        return { error: 'vision ocr empty', details: 'No text detected by Google Vision' };
      }

      const lines = text
        .split(/\r?\n/)
        .map((l) => this.normalizeSpaces(l))
        .filter(Boolean);

      // On tente le parser table d'abord
      const tableItems = this.parseAsTable(lines);
      if (tableItems.length >= 1) {
        return {
          filename: file.originalname || null,
          size: file.size || 0,
          parser: 'table',
          items: tableItems,
          raw_text_preview: lines.slice(0, 120),
        };
      }

      const items = this.parseAsLooseLines(lines);

      return {
        filename: file.originalname || null,
        size: file.size || 0,
        parser: 'default',
        items,
        raw_text_preview: lines.slice(0, 120),
      };
    } catch (err) {
      return { error: 'Failed to parse image', details: String(err) };
    } finally {
      try {
        const fs = require('fs');
        fs.unlinkSync(tmpPath);
      } catch {}
    }
  }

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('file', {
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
        },
      }),
    }),
  )
  async uploadPhoto(@UploadedFile() file: any) {
    if (!file) return { error: 'no file' };
    const url = `/uploads/fiches/${file.filename}`;
    return { url, size: file.size, filename: file.filename };
  }
}
