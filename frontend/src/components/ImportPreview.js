/**
 * ImportPreview - Component for importing and previewing parsed PDF/image files
 * 
 * - Receives a File prop and on mount attempts server parsing via parseFileWithServer
 * - If server parsing returns parsed=true with items, calls onItems(items)
 * - Otherwise fallbacks to client-side extractTextFromFile and passes results to onItems
 * - Shows user-friendly messages for each stage
 */
import React, { useState, useEffect } from 'react';
import { parseFileWithServer } from '../utils/api';
import { extractTextFromFile, parseIngredientsFromText } from '../utils/extractTextFromFile';

export default function ImportPreview({ file, onItems, onClose }) {
  const [stage, setStage] = useState('uploading'); // uploading, server-parsed, client-fallback, error, preview
  const [message, setMessage] = useState('');
  const [items, setItems] = useState([]);
  const [parsed, setParsed] = useState(null);
  const [errorDetail, setErrorDetail] = useState('');

  useEffect(() => {
    if (!file) {
      setStage('error');
      setMessage('No file provided');
      return;
    }

    attemptParsing();
  }, [file]);

  const attemptParsing = async () => {
    try {
      // Stage 1: Upload and try server parsing
      setStage('uploading');
      setMessage('Uploading to server...');

      const serverResult = await parseFileWithServer(file);

      // Check if server parsing succeeded
      if (serverResult.ok && serverResult.parsed && serverResult.items && serverResult.items.length > 0) {
        // Server parsed successfully
        setStage('server-parsed');
        setMessage(`Server parsed ${serverResult.items.length} items successfully`);
        setParsed({ items: serverResult.items, meta: { ...serverResult.meta, source: 'server' } });
        setItems(normalizeItems(serverResult.items));
        
        // Notify parent with items
        if (onItems) {
          onItems(serverResult.items);
        }
        return;
      }

      // Stage 2: Server parsing failed or returned no items, fallback to client
      console.log('Server parsing insufficient, falling back to client-side extraction');
      setStage('client-fallback');
      setMessage('Server parsing failed, trying client-side extraction...');

      const extractedText = await extractTextFromFile(file);
      if (!extractedText || extractedText.length < 10) {
        setStage('error');
        setMessage('Could not extract text from file');
        setErrorDetail(serverResult.errorMessage || 'No text extracted');
        return;
      }

      const clientParsed = parseIngredientsFromText(extractedText);
      const clientItems = clientParsed.items || [];

      if (clientItems.length === 0) {
        setStage('error');
        setMessage('No ingredients found in extracted text');
        setErrorDetail('Try with a different file or check the file format');
        return;
      }

      setStage('client-fallback');
      setMessage(`Client extracted ${clientItems.length} items`);
      setParsed({ items: clientItems, meta: { fileName: file.name, source: 'client-fallback' } });
      setItems(normalizeItems(clientItems));

      // Notify parent with items
      if (onItems) {
        onItems(clientItems);
      }

    } catch (error) {
      console.error('Import error:', error);
      setStage('error');
      setMessage('Error during import');
      setErrorDetail(error.message || String(error));
    }
  };

  const normalizeItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(it => ({
      ...it,
      name: it.name ?? it.nom ?? '',
      nom: it.nom ?? it.name ?? '',
      quantite: it.quantite ?? it.quantity ?? 0,
      unite: it.unite ?? it.unit ?? '',
      prix: it.prix ?? it.price ?? 0,
      confidence: it.confidence ?? it.confidenceScore ?? 0
    }));
  };

  const updateField = (index, field, value) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: value };
    // keep both name and nom in sync when editing name
    if (field === 'name') {
      copy[index].nom = value;
    }
    if (field === 'nom') {
      copy[index].name = value;
    }
    setItems(copy);
  };

  const handleCommit = () => {
    if (onItems) {
      onItems(items);
    }
    if (onClose) {
      onClose();
    }
  };

  // Render status message
  if (stage === 'uploading') {
    return (
      <div className="import-preview-modal" style={{
        position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 8, textAlign: 'center' }}>
          <div className="spinner" style={{ marginBottom: 16 }}>⏳</div>
          <div>{message}</div>
        </div>
      </div>
    );
  }

  // Render error
  if (stage === 'error') {
    return (
      <div className="import-preview-modal" style={{
        position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 8, maxWidth: 500 }}>
          <h3 style={{ color: '#d32f2f' }}>Import Error</h3>
          <p>{message}</p>
          {errorDetail && <p style={{ fontSize: '0.9em', color: '#666' }}>{errorDetail}</p>}
          <div style={{ marginTop: 20 }}>
            <button onClick={() => onClose && onClose()} style={{ padding: '8px 16px' }}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // Render preview with items
  return (
    <div className="import-preview-modal" style={{
      position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{ width: 800, maxHeight: '80%', overflowY: 'auto', background: '#fff', padding: 20, borderRadius: 8 }}>
        <h3>Prévisualisation de l'import</h3>
        <div style={{ marginBottom: 12 }}>
          <span style={{ 
            padding: '4px 8px', 
            borderRadius: 4, 
            fontSize: '0.85em',
            background: stage === 'server-parsed' ? '#4caf50' : '#ff9800',
            color: '#fff'
          }}>
            {stage === 'server-parsed' ? '✓ Server parsed' : '⚠ Client fallback'}
          </span>
          <span style={{ marginLeft: 12, color: '#666', fontSize: '0.9em' }}>{message}</span>
        </div>
        <p><small>{file?.name || 'Unknown file'} — {items.length} items</small></p>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Nom</th>
              <th>Quantité</th>
              <th>Unité</th>
              <th>Prix</th>
              <th>Confiance</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                <td>
                  <input value={it.name ?? ''} onChange={(e) => updateField(i, 'name', e.target.value)} style={{ width: '100%' }} />
                </td>
                <td style={{ width: 100 }}>
                  <input value={it.quantite ?? ''} onChange={(e) => updateField(i, 'quantite', e.target.value)} style={{ width: '100%' }} />
                </td>
                <td style={{ width: 100 }}>
                  <input value={it.unite ?? ''} onChange={(e) => updateField(i, 'unite', e.target.value)} style={{ width: '100%' }} />
                </td>
                <td style={{ width: 120 }}>
                  <input value={it.prix ?? ''} onChange={(e) => updateField(i, 'prix', e.target.value)} style={{ width: '100%' }} />
                </td>
                <td style={{ width: 80, textAlign: 'center' }}>
                  {(it.confidence || 0).toString().slice(0,5)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={() => onClose && onClose()} style={{ padding: '8px 12px' }}>Annuler</button>
          <button onClick={handleCommit} style={{ padding: '8px 12px' }}>Valider et enregistrer</button>
        </div>
      </div>
    </div>
  );
}