import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

/**
 * extractTextFromFile(file) :
 * - if PDF -> use pdfjs to extract text pages
 * - if image -> use tesseract.js to OCR
 * returns string text
 */

export async function extractTextFromFile(file) {
  if (!file) return '';
  const type = file.type || '';
  if (type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(it => (it.str || '')).join(' ');
        fullText += strings + '\\n';
      }
      return fullText;
    } catch (err) {
      console.error('pdfjs extract error', err);
      return '';
    }
  } else {
    try {
      const { data } = await Tesseract.recognize(await file.arrayBuffer(), 'fra', {
        logger: (m) => console.debug('tesseract', m)
      });
      return data?.text || '';
    } catch (err) {
      console.error('tesseract error', err);
      return '';
    }
  }
}

export function parseIngredientsFromText(text) {
  if (!text) return { meta: { lineCount: 0, fileName: '' }, items: [] };
  const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
  const items = lines.map((l, i) => {
    const parts = l.split(/\s{2,}| - |;|,/).map(p => p.trim()).filter(Boolean);
    return { name: parts[0] || l, quantite: 0, unite: '', prix: 0, raw: l, idx: i };
  });
  return { meta: { lineCount: lines.length, fileName: '' }, items };
}
