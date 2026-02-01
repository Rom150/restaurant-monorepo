import React, { useState, useRef } from 'react';
import ImportPreview from '../components/ImportPreview';

/**
 * MercurialeTab - import fichier / photo + preview with robust server/client fallback
 */
export default function MercurialeTab({ ingredients = [], setIngredients = () => {} }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('aucun fichier sélectionné');

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const handleFileSelected = (e) => {
    const file = e && e.target && e.target.files ? e.target.files[0] : undefined;
    if (!file) return;
    
    setSelectedFileName(file.name || 'fichier sélectionné');
    setSelectedFile(file);
    setShowPreview(true);
    
    // Clear the input so the same file can be selected again
    if (e.target) e.target.value = null;
  };

  const handlePhotoSelected = async (e) => {
    handleFileSelected(e);
  };

  const handleItems = (items) => {
    // Convert items to canonical ingredient shape
    // Use Date.now() * 1000 + index for more robust ID generation to avoid collisions
    const baseTimestamp = Date.now() * 1000;
    const converted = items.map((it, i) => ({
      id: baseTimestamp + i,
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
    setSelectedFile(null);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedFile(null);
    setSelectedFileName('aucun fichier sélectionné');
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
            onChange={handleFileSelected}
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

      {showPreview && selectedFile && (
        <ImportPreview
          file={selectedFile}
          onItems={handleItems}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}