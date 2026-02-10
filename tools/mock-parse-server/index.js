/**
 * Mock parse server with robust pdf-parse loading
 *
 * Usage:
 *   cd tools/mock-parse-server
 *   npm install
 *   npm start
 *
 * Endpoint: POST /parse (field name: file)
 */
const express = require('express');
const multer = require('multer');

let rawPdf;
try { rawPdf = require('pdf-parse'); } catch (e) { rawPdf = null; }

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const parseLine = (line) => {
  line = (line || '').replace(/\s+/g, ' ').trim();
  if (line.length < 3) return null;
  if (/^(produit|unité|prix unitaire|facture|total)/i.test(line)) return null;

  let m = line.match(/^(.+?)\s+([\d]+(?:[,\.]\d+)?)\s*(kg|l|g|ml|cl|pi[eè]ce|piece|unité|unite|botte|douzaine)\s+([\d]+[,\.][\d]{1,2})\s*€?\s*(?:[\d,\.]+\s*€?)?$/i);
  if (m) {
    const [, name, q, unit, price] = m;
    const prix = parseFloat(price.replace(',', '.'));
    const quantite = parseFloat(q.replace(',', '.'));
    if (!isNaN(prix) && !isNaN(quantite)) return { name: name.trim(), quantite, unite: unit, prix };
  }

  m = line.match(/^(.+?)\s+([\d]+[,\.][\d]{1,2})\s*€\s*$/i);
  if (m) {
    const [, name, price] = m;
    const prix = parseFloat(price.replace(',', '.'));
    if (!isNaN(prix)) return { name: name.trim(), quantite: 0, unite: '', prix };
  }

  return null;
};

const parseIngredientsFromText = (text) => {
  if (!text || typeof text !== 'string') return [];
  text = text.replace(/€\s+([A-ZÀ-Ÿ])/g, '€\n$1');
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items = [];
  for (const l of lines) {
    const parsed = parseLine(l);
    if (parsed) items.push(parsed);
  }
  return items;
};

app.post('/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file' });

    const fileName = req.file.originalname || 'file';
    const mimetype = req.file.mimetype || '';

    // resolve pdf-parse function robustly
    let pdfFunc = null;
    if (rawPdf && typeof rawPdf === 'function') pdfFunc = rawPdf;
    else if (rawPdf && typeof rawPdf.default === 'function') pdfFunc = rawPdf.default;
    else {
      try {
        const rp = require('pdf-parse');
        pdfFunc = (typeof rp === 'function') ? rp : (rp && typeof rp.default === 'function' ? rp.default : null);
      } catch (e) {
        pdfFunc = null;
      }
    }

    // If PDF but no pdf-parse available -> return 500 (developer should install)
    if ((mimetype === 'application/pdf' || /\.pdf$/i.test(fileName)) && !pdfFunc) {
      console.error('pdf-parse function not available (module shape unexpected). rawPdf =', typeof rawPdf);
      return res.status(500).json({ error: 'parse error', detail: 'pdf-parse function not available' });
    }

    if (mimetype === 'application/pdf' || /\.pdf$/i.test(fileName)) {
      // Wrap pdf parsing so pdf-parse-specific failures are treated as "no parse" (parsed:false)
      try {
        const data = await pdfFunc(req.file.buffer);
        const text = data && data.text ? String(data.text) : '';
        const items = parseIngredientsFromText(text);
        if (!items || items.length === 0) {
          return res.status(200).json({ meta: { fileName, source: 'server', parsed: false }, items: [] });
        }
        return res.status(200).json({ meta: { fileName, source: 'server' }, items });
      } catch (pdfErr) {
        // pdf-parse failed (e.g. bad XRef entry). Do NOT crash — return parsed:false so frontend falls back to client parsing/ocr.
        console.error('pdf-parse failed for', fileName, pdfErr && pdfErr.stack ? pdfErr.stack : pdfErr);
        return res.status(200).json({
          meta: { fileName, source: 'server', parsed: false, parseError: String(pdfErr && pdfErr.message ? pdfErr.message : pdfErr) },
          items: []
        });
      }
    }

    // non-PDF simple fallback for dev
    return res.status(200).json({
      meta: { fileName, source: 'server', note: 'no-pdf-fallback' },
      items: [
        { name: 'Farine', quantite: 10, unite: 'kg', prix: 2 },
        { name: 'Sel', quantite: 1, unite: 'kg', prix: 0.5 }
      ]
    });
  } catch (err) {
    console.error('Parse error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'parse error', detail: String(err && err.message ? err.message : err) });
  }
});

const port = process.env.PORT || 9000;
app.listen(port, () => console.log('Mock parse server running on http://localhost:' + port));