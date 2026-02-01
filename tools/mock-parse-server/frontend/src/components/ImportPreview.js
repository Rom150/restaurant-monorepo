import React, { useEffect, useState } from 'react';
import { parseFileWithServer } from '../utils/api';

/**
 * extractTextFromFile(file) should exist in your codebase.
 * If it doesn't, implement a small helper using pdfjs-dist or tesseract.js on the client.
 * Here we assume extractTextFromFile(file) returns a Promise<string>.
 */
import { extractTextFromFile } from '../utils/extractTextFromFile';

export default function ImportPreview({ file, onItems }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setMessage('Uploading to server parser...');
      const server = await parseFileWithServer(file);
      if (cancelled) return;
      if (server.ok && server.parsed) {
        setItems(server.items);
        setMessage('Parsed by server');
        onItems && onItems(server.items);
        setLoading(false);
        return;
      }
      // Server didn't parse (or returned error) -> fallback client-side
      setMessage(server.errorMessage ? `Server parsing error: ${server.errorMessage}. Trying client-side...` : 'Server returned no items — trying client-side parsing...');
      try {
        const text = await extractTextFromFile(file);
        // Minimal local parse (conservative): split lines and try to detect price pattern.
        const lines = (text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const localItems = [];
        const priceRe = /([\d]+(?:[.,]\d{1,2})?)\s*€\s*$/;
        for (const l of lines) {
          const m = l.match(priceRe);
          if (m) {
            const price = parseFloat(m[1].replace(',', '.'));
            const name = l.replace(priceRe, '').trim();
            if (name) localItems.push({ name, quantite: 0, unite: '', prix: price });
          }
        }
        setItems(localItems);
        setMessage(localItems.length ? 'Client-side parsing produced results (verify)' : 'Client parsing returned no items — manual review required');
        onItems && onItems(localItems, text);
      } catch (e) {
        setMessage('Client parsing failed: ' + String(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [file, onItems]);

  return (
    <div>
      <div>{message}</div>
      {loading ? <div>Loading…</div> : (
        <div>
          {items.length === 0 ? <div>Aucun élément détecté — vérifie l’aperçu ou modifie manuellement</div> :
            <ul>{items.map((it, i) => <li key={i}>{it.name} — {it.quantite} {it.unite} — {it.prix}€</li>)}</ul>}
        </div>
      )}
    </div>
  );
}
