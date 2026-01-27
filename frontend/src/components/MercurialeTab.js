import React, { useState } from 'react';
import ImportPreview from '../components/ImportPreview';
import { uploadParse, uploadCommit } from '../utils/api';

/**
 * MercurialeTab - composant simplifié
 * - Props attendues si intégration : mercuriales, setMercuriales
 * Remplace le fichier existant ou adapte la logique au sein de ton composant.
 */

export default function MercurialeTab({ mercuriales = [], setMercuriales = () => {} }) {
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ message: '', percent: 0 });
  const [parsedForPreview, setParsedForPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('⚠️ Format non supporté. Utilisez PDF, JPG ou PNG');
      e.target.value = null;
      return;
    }

    if (process.env.REACT_APP_API_URL) {
      try {
        setImporting(true);
        setImportProgress({ message: 'Upload...', percent: 0.1 });

        const parsed = await uploadParse(file);

        setParsedForPreview(parsed);
        setShowPreview(true);
      } catch (err) {
        console.error('Erreur import via API:', err);
        alert(`Erreur import: ${err?.message || err}`);
      } finally {
        setImporting(false);
        setImportProgress({ message: '', percent: 0 });
        e.target.value = null;
      }
      return;
    }

    // fallback client-side: si tu as mercurialeImport fonctionnelle côté client
    try {
      setImporting(true);
      setImportProgress({ message: 'Analyse locale...', percent: 0.1 });

      if (typeof window.importMercuriale === 'function') {
        const parsed = await window.importMercuriale(file, (message, percent) => {
          setImportProgress({ message, percent });
        });

        if (parsed && parsed.items) {
          // proposez l'ajout direct
          if (window.confirm(`Ajouter ${parsed.items.length} lignes détectées à la mercuriale ?`)) {
            const newEntries = parsed.items.map((it) => ({
              id: Date.now() + Math.random(),
              name: it.name,
              quantite: it.quantite || 0,
              unite: it.unite || 'unit',
              prix: it.prix || 0,
            }));
            setMercuriales((prev) => [...newEntries, ...prev]);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          }
        } else {
          alert('Aucun résultat retourné par le parser local.');
        }
      } else {
        alert('Aucun parser client disponible. Configure REACT_APP_API_URL ou fournissez importMercuriale.');
      }
    } catch (err) {
      console.error('Erreur import local:', err);
      alert(`Erreur lors de l'import local : ${err?.message || err}`);
    } finally {
      setImporting(false);
      setImportProgress({ message: '', percent: 0 });
      e.target.value = null;
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Mercuriale</h2>
        <div>
          <label>
            <input type="file" accept=".pdf,image/*" onChange={handleFileImport} />
            <span style={{ marginLeft: 8 }}>Importer mercuriale</span>
          </label>
        </div>
      </header>

      {importing && (
        <div style={{ marginTop: 12 }}>
          <div>{importProgress.message}</div>
          <div style={{ width: '100%', height: 8, background: '#eee', borderRadius: 4, marginTop: 6 }}>
            <div
              style={{
                width: `${Math.min(100, (importProgress.percent || 0) * 100)}%`,
                height: '100%',
                background: '#2b8aef',
                borderRadius: 4,
                transition: 'width 200ms',
              }}
            />
          </div>
        </div>
      )}

      {showSuccess && <div style={{ marginTop: 12, color: 'green' }}>Import ajouté avec succès ✅</div>}

      <section style={{ marginTop: 16 }}>
        <h3>Liste (aperçu) — {mercuriales.length} lignes</h3>
        <ul>
          {mercuriales.slice(0, 50).map((m) => (
            <li key={m.id || Math.random()}>
              {m.name} — {m.quantite} {m.unite} — {m.prix ? `${m.prix} €` : ''}
            </li>
          ))}
        </ul>
      </section>

      {showPreview && parsedForPreview && (
        <ImportPreview
          parsed={parsedForPreview}
          onClose={() => setShowPreview(false)}
          onCommit={async (payload) => {
            try {
              setImporting(true);
              await uploadCommit({ ...payload, type: 'mercuiale' });
              alert('✅ Import enregistré sur le serveur.');
              setShowPreview(false);
            } catch (err) {
              console.error(err);
              alert('Erreur lors du commit : ' + (err?.message || err));
            } finally {
              setImporting(false);
            }
          }}
        />
      )}
    </div>
  );
}
