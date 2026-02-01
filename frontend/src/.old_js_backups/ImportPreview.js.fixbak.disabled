import React, { useState } from 'react';

export default function ImportPreview({ parsed, onClose, onCommit }) {
  const [items, setItems] = useState(parsed?.items || []);

  const updateField = (index, field, value) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: value };
    setItems(copy);
  };

  return (
    <div className="import-preview-modal" style={{
      position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{ width: 800, maxHeight: '80%', overflowY: 'auto', background: '#fff', padding: 20, borderRadius: 8 }}>
        <h3>Prévisualisation de l'import</h3>
        <p><small>{parsed?.meta?.fileName} — {parsed?.meta?.lineCount} lignes</small></p>

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
                  <input value={it.name || ''} onChange={(e) => updateField(i, 'name', e.target.value)} style={{ width: '100%' }} />
                </td>
                <td style={{ width: 100 }}>
                  <input value={it.quantite ?? ''} onChange={(e) => updateField(i, 'quantite', e.target.value)} style={{ width: '100%' }} />
                </td>
                <td style={{ width: 100 }}>
                  <input value={it.unite || ''} onChange={(e) => updateField(i, 'unite', e.target.value)} style={{ width: '100%' }} />
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
          <button onClick={() => onCommit && onCommit({ items, meta: parsed.meta })} style={{ padding: '8px 12px' }}>Valider et enregistrer</button>
        </div>
      </div>
    </div>
  );
}
