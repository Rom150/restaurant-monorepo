/**
 * Mock parse server with robust pdf-parse loading
 *
 * Usage: node tools/mock-parse-server/index.js
 *
 * Requires: npm i pdf-parse multer
 */

const express = require('express');
const multer = require('multer');

// try to require pdf-parse now (handle different export shapes)
let rawPdf = null;
try { rawPdf = require('pdf-parse'); } catch (e) { rawPdf = null; }

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const parseLine = (line) => {
  line = line.replace(/\s+/g, ' ').trim();
  if (line.length < 4) return null;
  if (/^(produit|unité|prix unitaire|facture|total)/i.test(line)) return null;

  let m = line.match(/^(.+?)\s+([\d]+(?:[,\.]\d+)?)\s*(kg|l|g|ml|cl|pi[eè]ce|piece|unité|unite|botte|douzaine)\s+([\d]+[,\.][\d]{1,2})\s*€?\s+[\d,\.]+\s*€?\s*$/i);
  if (m) {
    const [, name, q, unit, price] = m;
    const prix = parseFloat(price.replace(',', '.'));
    const quantite = parseFloat(q.replace(',', '.'));
    if (!isNaN(prix) && prix > 0 && name.length >= 2) return { name: name.trim(), quantite, unite: unit, prix };
  }

  m = line.match(/^(.+?)\s+([\d]+(?:[,\.]\d+)?)\s*(kg|l|g|ml|cl|pi[eè]ce|piece|unité|unite|botte|douzaine)\s+([\d]+[,\.][\d]{1,2})\s*€?\s*$/i);
  if (m) {
    const [, name, q, unit, price] = m;
    const prix = parseFloat(price.replace(',', '.'));
    const quantite = parseFloat(q.replace(',', '.'));
    if (!isNaN(prix) && prix > 0 && name.length >= 2) return { name: name.trim(), quantite, unite: unit, prix };
  }

  m = line.match(/^(.+?)\s+(kg|l|g|ml|cl|pi[eè]ce|piece|unité|unite|botte|douzaine)\s+([\d]+[,\.][\d]{1,2})\s*€?\s*$/i);
  if (m) {
    const [, name, unit, price] = m;
    const prix = parseFloat(price.replace(',', '.'));
    if (!isNaN(prix) && prix > 0 && name.length >= 2) return { name: name.trim(), quantite: 0, unite: unit, prix };
  }

  m = line.match(/^(.+?)\s+([\d]+[,\.][\d]{1,2})\s*€\s*$/i);
  if (m) {
    const [, name, price] = m;
    const prix = parseFloat(price.replace(',', '.'));
    if (!isNaN(prix) && prix > 0 && name.length >= 2) return { name: name.trim(), quantite: 0, unite: '', prix };
  }

  return null;
};

const parseIngredientsFromText = (text) => {
  if (!text || typeof text !== 'string') return [];
  text = text.replace(/€\s+([A-ZÀ-Ÿ])/g, '€\n$1');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  const ingredients = [];
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i]);
    if (parsed) ingredients.push(parsed);
  }
  return ingredients;
};

app.post('/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file' });

    const fileName = req.file.originalname || 'file';
    const mimetype = req.file.mimetype || '';

    // Resolve pdf-parse function at runtime (robust to different export shapes)
    let pdfFunc = null;
    if (rawPdf && typeof rawPdf === 'function') pdfFunc = rawPdf;
    else if (rawPdf && typeof rawPdf.default === 'function') pdfFunc = rawPdf.default;
    else {
      // try fresh require (in case of transient module state)
      try {
        const rp = require('pdf-parse');
        pdfFunc = typeof rp === 'function' ? rp : (rp && typeof rp.default === 'function' ? rp.default : null);
      } catch (e) {
        pdfFunc = null;
      }
    }

    // If still not available, return an informative error
    if (!pdfFunc && (mimetype === 'application/pdf' || /\.pdf$/i.test(fileName))) {
      console.error('pdf-parse function not available (module shape unexpected). rawPdf =', typeof rawPdf);
      return res.status(500).json({ error: 'parse error', detail: 'pdf-parse function not available' });
    }

    if (mimetype === 'application/pdf' || /\.pdf$/i.test(fileName)) {
      try {
        const data = await pdfFunc(req.file.buffer);
        const text = data && data.text ? String(data.text) : '';
        const items = parseIngredientsFromText(text);
        if (!items || items.length === 0) {
          return res.status(200).json({ meta: { fileName, source: 'server', parsed: false }, items: [] });
        }
        return res.status(200).json({ meta: { fileName, source: 'server' }, items });
      } catch (pdfError) {
        // PDF parsing failed (malformed PDF, etc) - return parsed:false so frontend can fallback
        console.error('PDF parsing failed:', pdfError.message || pdfError);
        return res.status(200).json({ 
          meta: { fileName, source: 'server', parsed: false, error: pdfError.message || 'PDF parsing failed' }, 
          items: [] 
        });
      }
    }

    // Non-PDF fallback (images etc)
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
