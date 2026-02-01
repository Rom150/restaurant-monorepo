import React, { useState, useRef } from 'react';
import ImportPreview from '../components/ImportPreview';
import { uploadParse as uploadParseClient } from '../utils/api';
import { extractTextFromFile, parseIngredientsFromText } from '../utils/extractTextFromFile';

/**
 * MercurialeTab - import fichier / photo + preview
 */
export default function MercurialeTab({ ingredients = [], setIngredients = () => {} }) {
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ message: '', percent: 0 });
  const [parsedForPreview, setParsedForPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('aucun fichier sélectionné');

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const finish = (e) => {
    setImporting(false);
    setImportProgress({ message: '', percent: 0 });
    if (e && e.target) e.target.value = null;
    setSelectedFileName('aucun fichier sélectionné');
  };

  const handleParsedResult = (parsed) => {
    setParsedForPreview(parsed);
    setShowPreview(true);
  };

  // Heuristic to detect the mock/static backend response (the mock returns Farine + Sel)
  const isLikelyMockResponse = (parsed) => {
    if (!parsed) return true;
    const items = parsed.items || parsed;
    if (!Array.isArray(items) || items.length === 0) return true;
    // If backend returned exactly the two static items used by the mock
    if (items.length === 2 && items[0].name === 'Farine' && items[1].name === 'Sel') return true;
    // If there are only a couple of items (too few) consider fallback to client parser
    if (items.length <= 2) return true;
    return false;
  };

  const handleFileImport = async (e) => {
    const file = e && e.target && e.target.files ? e.target.files[0] : undefined;
    if (!file) return;
    setSelectedFileName(file.name || 'fichier sélectionné');

    try {
      setImporting(true);
      setImportProgress({ message: 'Analyse en cours...', percent: 0.05 });

      // 1) essayer le parse côté backend si disponible
      if (typeof uploadParseClient === 'function') {
        try {
          const parsed = await uploadParseClient(file); // attend un JSON parsé

          // If the parsed response looks like the static mock or is too small,
          // fallback to client-side extraction for a better result.
          if (isLikelyMockResponse(parsed)) {
            console.warn('Backend parse looks like mock/insufficient result — using client-side parser instead.');
            // fallback to client-side extraction
            const text = await extractTextFromFile(file);
            const clientParsedItems = parseIngredientsFromText(text || '');
            handleParsedResult({ meta: { fileName: file.name, source: 'client-fallback' }, items: clientParsedItems });
            finish(e);
            return;
          }

          // otherwise use backend result
          handleParsedResult(parsed);
          finish(e);
          return;
        } catch (err) {
          console.warn('uploadParse failed, falling back to client OCR:', err);
        }
      }

      // 2) fallback côté client : extraction texte et parsing simple
      const text = await extractTextFromFile(file); // pdfjs ou tesseract selon le type
      const parsed = parseIngredientsFromText(text || '');
      handleParsedResult({ meta: { fileName: file.name, source: 'client' }, items: parsed });
    } catch (err) {
      console.error('Erreur import:', err);
      // utilisation d'un template literal pour éviter les problèmes d'échappement
      alert(`Erreur lors de l'import : ${((err && err.message) || String(err))}`);
    } finally {
      finish(e);
    }
  };

  const handlePhotoSelected = async (e) => {
    await handleFileImport(e);
  };

  const onClickImportButton = () => fileInputRef.current && fileInputRef.current.click();
  const onClickPhotoButton = () => photoInputRef.current && photoInputRef.current.click();

  // Helper to render display name / price for items with different keys
  const getDisplayName = (it) => it.nom || it.name || '';
  const getQty = (it) => (it.quantite ?? it.quantity ?? 0);
  const getUnit = (it) => it.unite || it.unit || '';
  const getPrice = (it) => (it.prix ?? it.price ?? 0);

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Mercuriale</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="mr-btn-primary" onClick={onClickImportButton}>Choisir le fichier</button>
          <button className="mr-btn-secondary" onClick={onClickPhotoButton}>Ajouter photo</button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            style={{ display: 'none' }}
            onChange={handleFileImport}
          />
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handlePhotoSelected}
          />

          <div style={{ fontSize: 13, color: '#666' }}>{selectedFileName}</div>
        </div>
      </header>

      {importing && (
        <div style={{ marginTop: 12 }}>
          <div>{importProgress.message}</div>
          <div style={{ width: '100%', height: 8, background: '#eee', borderRadius: 4, marginTop: 6 }}>
            <div style={{ width: `${Math.min(100, (importProgress.percent || 0) * 100)}%`, height: 8, background: '#4caf50', borderRadius: 4 }} />
          </div>
        </div>
      )}

      <section style={{ marginTop: 16 }}>
        <h3>Liste (aperçu)</h3>
        <div style={{ marginTop: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fff', borderBottom: '1px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Nom</th>
                <th style={{ padding: 8 }}>Quantité</th>
                <th style={{ padding: 8 }}>Unité</th>
                <th style={{ padding: 8 }}>Prix</th>
                <th style={{ padding: 8 }}>Photo</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(ingredients) && ingredients.length > 0 ? (
                ingredients.map((it, idx) => (
                  <tr key={it.id || idx} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ padding: 8 }}>{getDisplayName(it)}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>{getQty(it)}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>{getUnit(it)}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{getPrice(it)}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>{it.photo ? 'oui' : ''}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: 12, color: '#666' }}>Aucun ingrédient — importez une mercuriale ou chargez des données démo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showPreview && parsedForPreview && (
        <div style={{ marginTop: 16 }}>
          <ImportPreview
            parsed={parsedForPreview}
            onClose={() => setShowPreview(false)}
            onCommit={async (data) => {
              // Convert preview items (may have name or nom) to canonical ingredient shape (uses 'nom', 'prix', 'unite', 'quantite')
              const items = Array.isArray(data.items) ? data.items : [];
              const converted = items.map((it, i) => ({
                id: Date.now() + i,
                nom: it.nom || it.name || '',
                prix: Number(it.prix ?? it.price ?? 0) || 0,
                unite: it.unite || it.unit || 'unité',
                quantite: Number(it.quantite ?? it.quantity ?? 0) || 0,
                allergenes: it.allergenes || [],
                photo: it.photo || null
              })).filter(it => it.nom && it.prix > 0);

              if (converted.length > 0) {
                setIngredients(prev => [...converted, ...prev]);
              }
              setShowPreview(false);
            }}
          />
        </div>
      )}
    </div>
  );
}