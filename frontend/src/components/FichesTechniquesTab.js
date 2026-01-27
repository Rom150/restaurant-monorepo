import React, { useState } from 'react';
import ImportPreview from '../components/ImportPreview';
import { uploadParse, uploadCommit } from '../utils/api';

/**
 * Composant FichesTechniquesTab
 * - props attendus (pour intégration facile) :
 *    fiches: array d'objets fiches techniques
 *    setFiches: fonction pour mettre à jour la liste des fiches
 *
 * Si tu as déjà un composant existant, remplace uniquement sa fonction handleFileImport
 * par celle-ci ou remplace le fichier complet avec ce contenu.
 */

export default function FichesTechniquesTab({ fiches = [], setFiches = () => {} }) {
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ message: '', percent: 0 });
  const [parsedForPreview, setParsedForPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // handleFileImport : lit un fichier, appelle le backend si REACT_APP_API_URL défini,
  // ouvre la modal ImportPreview avec la réponse (pour validation/édition) et permet commit.
  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('⚠️ Format non supporté. Utilisez PDF, JPG ou PNG');
      e.target.value = null;
      return;
    }

    // Si une URL de backend est configurée, on délègue le parsing au serveur
    if (process.env.REACT_APP_API_URL) {
      try {
        setImporting(true);
        setImportProgress({ message: 'Upload du fichier...', percent: 0.1 });

        const parsed = await uploadParse(file);

        setImportProgress({ message: 'Analyse terminée', percent: 1.0 });

        setParsedForPreview(parsed);
        setShowPreview(true);
      } catch (err) {
        console.error('Erreur import via API:', err);
        alert(`Erreur import : ${err?.message || err}`);
      } finally {
        setImporting(false);
        setImportProgress({ message: '', percent: 0 });
        e.target.value = null;
      }
      return;
    }

    // Fallback client-side : tente d'appeler une fonction globale importFicheTechnique si existante
    try {
      setImporting(true);
      setImportProgress({ message: 'Analyse locale...', percent: 0.1 });

      if (typeof window.importFicheTechnique === 'function') {
        // signature supposée : importFicheTechnique(file, progressCallback) -> recipe
        const recipe = await window.importFicheTechnique(file, (message, percent) =>
          setImportProgress({ message, percent })
        );

        // Si la fonction renvoie un objet recette, on propose directement l'ajout
        if (recipe) {
          // si tu disposes de validateRecipe/detectDuplicateRecipes dans ton code, tu peux les appeler ici.
          // Pour rester générique, on demande confirmation simple :
          if (window.confirm(`Ajouter la fiche "${recipe.nom || 'nouvelle fiche'}" détectée ?`)) {
            const newFiche = {
              ...recipe,
              id: Date.now(),
              photo: recipe.photo || null,
              date: new Date().toISOString(),
            };
            setFiches((prev) => [...prev, newFiche]);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          }
        } else {
          alert('Import local : aucun résultat retourné par importFicheTechnique.');
        }
      } else {
        alert(
          'Aucun parser client disponible. Configure REACT_APP_API_URL pour utiliser le backend ou fournissez une fonction globale importFicheTechnique.'
        );
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
        <h2>Fiches techniques</h2>
        <div>
          <label style={{ marginRight: 8 }}>
            <input type="file" accept=".pdf,image/*" onChange={handleFileImport} style={{ display: 'inline-block' }} />
            <span style={{ marginLeft: 8 }}>Importer fiche / facture</span>
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

      {showSuccess && <div style={{ marginTop: 12, color: 'green' }}>Fiche ajoutée avec succès ✅</div>}

      {/* Placeholder list (tu peux remplacer par ton affichage actuel des fiches) */}
      <section style={{ marginTop: 16 }}>
        <h3>Liste (aperçu) — {fiches.length} fiches</h3>
        <ul>
          {fiches.slice(0, 20).map((f) => (
            <li key={f.id || f.nom || Math.random()}>
              {f.nom || f.name || 'Fiche sans nom'} {f.date ? `— ${new Date(f.date).toLocaleDateString()}` : ''}
            </li>
          ))}
        </ul>
      </section>

      {/* Modal de prévisualisation et commit */}
      {showPreview && parsedForPreview && (
        <ImportPreview
          parsed={parsedForPreview}
          onClose={() => setShowPreview(false)}
          onCommit={async (payload) => {
            try {
              setImporting(true);
              setImportProgress({ message: 'Enregistrement...', percent: 0.2 });

              // Envoie au backend pour persistance
              await uploadCommit({ ...payload, type: 'fiche', targetProductName: payload.meta?.targetProductName });

              setImportProgress({ message: 'Terminé', percent: 1.0 });
              alert('✅ Import enregistré sur le serveur.');
              setShowPreview(false);
            } catch (err) {
              console.error('Erreur commit:', err);
              alert('Erreur lors de l\\'enregistrement : ' + (err?.message || err));
            } finally {
              setImporting(false);
              setImportProgress({ message: '', percent: 0 });
            }
          }}
        />
      )}
    </div>
  );
}
