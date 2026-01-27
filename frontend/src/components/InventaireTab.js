import React, { useState, useMemo } from 'react';
import { Package, AlertTriangle, TrendingDown, Plus, History, ShoppingCart, Download } from 'lucide-react';

const InventaireTab = ({ ingredients, setIngredients, fiches }) => {
  const [showEntreeModal, setShowEntreeModal] = useState(false);
  const [showHistoriqueModal, setShowHistoriqueModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  
  const [entreeForm, setEntreeForm] = useState({
    quantite: '',
    motif: 'Livraison',
    prixUnitaire: ''
  });

  /**
   * Calcule les statistiques du stock
   */
  const statsStock = useMemo(() => {
    let critique = 0;
    let bas = 0;
    let ok = 0;
    let valeurTotale = 0;

    ingredients.forEach(ing => {
      const stock = ing.stockActuel || 0;
      const min = ing.stockMin || 0;
      const crit = ing.stockCritique || 0;

      if (stock <= crit) critique++;
      else if (stock <= min) bas++;
      else ok++;

      valeurTotale += stock * (ing.prix || 0);
    });

    return { critique, bas, ok, valeurTotale };
  }, [ingredients]);

  /**
   * Détermine le statut du stock
   */
  const getStockStatus = (ingredient) => {
    const stock = ingredient.stockActuel || 0;
    const min = ingredient.stockMin || 0;
    const crit = ingredient.stockCritique || 0;

    if (stock <= crit) return { label: '🔴 Critique', color: 'critical', percent: (stock / min) * 100 };
    if (stock <= min) return { label: '🟠 Bas', color: 'low', percent: (stock / min) * 100 };
    return { label: '🟢 OK', color: 'ok', percent: Math.min((stock / (ingredient.stockMax || min * 2)) * 100, 100) };
  };

  /**
   * Ouvre la modal d'entrée de stock
   */
  const openEntreeModal = (ingredient) => {
    setSelectedIngredient(ingredient);
    setEntreeForm({
      quantite: '',
      motif: 'Livraison',
      prixUnitaire: ingredient.prix.toString()
    });
    setShowEntreeModal(true);
  };

  /**
   * Enregistre une entrée de stock
   */
  const enregistrerEntree = () => {
    if (!entreeForm.quantite || parseFloat(entreeForm.quantite) <= 0) {
      alert('Veuillez saisir une quantité valide.');
      return;
    }

    const quantite = parseFloat(entreeForm.quantite);
    const prixUnitaire = parseFloat(entreeForm.prixUnitaire) || selectedIngredient.prix;

    const mouvement = {
      date: new Date().toISOString(),
      type: 'entrée',
      quantite: quantite,
      motif: entreeForm.motif,
      prixUnitaire: prixUnitaire
    };

    setIngredients(ingredients.map(ing => {
      if (ing.id === selectedIngredient.id) {
        return {
          ...ing,
          stockActuel: (ing.stockActuel || 0) + quantite,
          mouvements: [...(ing.mouvements || []), mouvement]
        };
      }
      return ing;
    }));

    setShowEntreeModal(false);
    setEntreeForm({ quantite: '', motif: 'Livraison', prixUnitaire: '' });
  };

  /**
   * Ouvre la modal de configuration
   */
  const openConfigModal = (ingredient) => {
    setSelectedIngredient(ingredient);
    setShowConfigModal(true);
  };

  /**
   * Sauvegarde la configuration des seuils
   */
  const saveConfig = (config) => {
    setIngredients(ingredients.map(ing => {
      if (ing.id === selectedIngredient.id) {
        return {
          ...ing,
          stockActuel: parseFloat(config.stockActuel) || 0,
          stockMin: parseFloat(config.stockMin) || 0,
          stockCritique: parseFloat(config.stockCritique) || 0,
          stockMax: parseFloat(config.stockMax) || 0
        };
      }
      return ing;
    }));
    setShowConfigModal(false);
  };

  /**
   * Génère la liste de courses
   */
  const genererListeCourses = () => {
    const aCommander = ingredients
      .filter(ing => (ing.stockActuel || 0) < (ing.stockMin || 0))
      .map(ing => ({
        nom: ing.nom,
        stockActuel: ing.stockActuel || 0,
        stockMax: ing.stockMax || (ing.stockMin || 0) * 2,
        aCommander: Math.max(0, (ing.stockMax || (ing.stockMin || 0) * 2) - (ing.stockActuel || 0)),
        unite: ing.unite,
        prix: ing.prix,
        statut: getStockStatus(ing).label
      }));

    return aCommander;
  };

  /**
   * Exporte la liste de courses en PDF
   */
  const exporterListeCourses = () => {
    const liste = genererListeCourses();
    
    if (liste.length === 0) {
      alert('✅ Tous les stocks sont OK ! Pas besoin de commander.');
      return;
    }

    // Créer le contenu texte
    let contenu = 'LISTE DE COURSES\n';
    contenu += '==================\n\n';
    contenu += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
    
    liste.forEach(item => {
      contenu += `${item.statut} ${item.nom}\n`;
      contenu += `   Stock actuel: ${item.stockActuel.toFixed(2)} ${item.unite}\n`;
      contenu += `   À commander: ${item.aCommander.toFixed(2)} ${item.unite}\n`;
      contenu += `   Coût estimé: ${(item.aCommander * item.prix).toFixed(2)}€\n\n`;
    });

    const coutTotal = liste.reduce((sum, item) => sum + (item.aCommander * item.prix), 0);
    contenu += `\nCOÛT TOTAL ESTIMÉ: ${coutTotal.toFixed(2)}€\n`;

    // Créer un blob et télécharger
    const blob = new Blob([contenu], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liste-courses-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    alert(`📋 Liste de courses exportée !\n\n${liste.length} produit(s) à commander\nCoût estimé: ${coutTotal.toFixed(2)}€`);
  };

  /**
   * Initialise les stocks si nécessaire
   */
  const initialiserStocks = () => {
    const updated = ingredients.map(ing => ({
      ...ing,
      stockActuel: ing.stockActuel !== undefined ? ing.stockActuel : 0,
      stockMin: ing.stockMin !== undefined ? ing.stockMin : 5,
      stockCritique: ing.stockCritique !== undefined ? ing.stockCritique : 2,
      stockMax: ing.stockMax !== undefined ? ing.stockMax : 20,
      mouvements: ing.mouvements || []
    }));
    setIngredients(updated);
  };

  // Initialiser les stocks au montage
  React.useEffect(() => {
    const needsInit = ingredients.some(ing => ing.stockActuel === undefined);
    if (needsInit) {
      initialiserStocks();
    }
  }, []);

  return (
    <div className="tab-content">
      {/* Statistiques */}
      <div className="card">
        <h2 className="card-title">📦 Inventaire ({ingredients.length} ingrédients)</h2>
        
        <div className="stock-stats">
          <div className="stat-card critical">
            <div className="stat-icon">🔴</div>
            <div className="stat-content">
              <div className="stat-value">{statsStock.critique}</div>
              <div className="stat-label">Stock critique</div>
            </div>
          </div>

          <div className="stat-card low">
            <div className="stat-icon">🟠</div>
            <div className="stat-content">
              <div className="stat-value">{statsStock.bas}</div>
              <div className="stat-label">Stock bas</div>
            </div>
          </div>

          <div className="stat-card ok">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <div className="stat-value">{statsStock.ok}</div>
              <div className="stat-label">Stock OK</div>
            </div>
          </div>

          <div className="stat-card value">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">{statsStock.valeurTotale.toFixed(0)}€</div>
              <div className="stat-label">Valeur totale</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button className="btn-primary" onClick={exporterListeCourses}>
            <ShoppingCart size={18} />
            Liste de courses
          </button>
          <button className="btn-secondary" onClick={() => alert('Fonction en développement')}>
            <Download size={18} />
            Export inventaire
          </button>
        </div>
      </div>

      {/* Liste des stocks */}
      <div className="card">
        <h2 className="card-title">📋 Stocks détaillés</h2>

        <div className="stock-list">
          {ingredients.map(ing => {
            const status = getStockStatus(ing);
            const stock = ing.stockActuel || 0;
            const max = ing.stockMax || (ing.stockMin || 5) * 2;

            return (
              <div key={ing.id} className={`stock-item status-${status.color}`}>
                <div className="stock-header">
                  <div className="stock-name">
                    <strong>{ing.nom}</strong>
                    <span className="stock-status">{status.label}</span>
                  </div>
                  <div className="stock-quantity">
                    {stock.toFixed(2)} / {max.toFixed(0)} {ing.unite}
                  </div>
                </div>

                <div className="stock-progress">
                  <div 
                    className={`stock-bar ${status.color}`}
                    style={{ width: `${Math.min(status.percent, 100)}%` }}
                  />
                </div>

                <div className="stock-actions">
                  <button 
                    className="btn-icon-small"
                    onClick={() => openEntreeModal(ing)}
                    title="Ajouter stock"
                  >
                    <Plus size={16} />
                    Entrée
                  </button>
                  <button 
                    className="btn-icon-small"
                    onClick={() => openConfigModal(ing)}
                    title="Configurer seuils"
                  >
                    ⚙️ Config
                  </button>
                  <button 
                    className="btn-icon-small"
                    onClick={() => {
                      setSelectedIngredient(ing);
                      setShowHistoriqueModal(true);
                    }}
                    title="Historique"
                  >
                    <History size={16} />
                  </button>
                </div>

                {stock <= (ing.stockCritique || 0) && (
                  <div className="stock-alert critical">
                    ⚠️ Stock critique ! Commander {((ing.stockMax || 20) - stock).toFixed(2)} {ing.unite}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Entrée de stock */}
      {showEntreeModal && selectedIngredient && (
        <div className="modal-overlay" onClick={() => setShowEntreeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>➕ Entrée de stock</h2>
            <h3>{selectedIngredient.nom}</h3>

            <div className="form-group">
              <label>Quantité *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  step="0.01"
                  value={entreeForm.quantite}
                  onChange={(e) => setEntreeForm({ ...entreeForm, quantite: e.target.value })}
                  placeholder="Ex: 10"
                  style={{ flex: 1 }}
                />
                <span style={{ alignSelf: 'center', fontWeight: '600' }}>{selectedIngredient.unite}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Motif</label>
              <select
                value={entreeForm.motif}
                onChange={(e) => setEntreeForm({ ...entreeForm, motif: e.target.value })}
              >
                <option value="Livraison">Livraison</option>
                <option value="Ajustement inventaire">Ajustement inventaire</option>
                <option value="Retour fournisseur">Retour fournisseur</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div className="form-group">
              <label>Prix unitaire</label>
              <input
                type="number"
                step="0.01"
                value={entreeForm.prixUnitaire}
                onChange={(e) => setEntreeForm({ ...entreeForm, prixUnitaire: e.target.value })}
                placeholder={selectedIngredient.prix.toFixed(2)}
              />
            </div>

            <div className="stock-preview">
              <div>Stock actuel: <strong>{(selectedIngredient.stockActuel || 0).toFixed(2)} {selectedIngredient.unite}</strong></div>
              {entreeForm.quantite && (
                <div>Nouveau stock: <strong>{((selectedIngredient.stockActuel || 0) + parseFloat(entreeForm.quantite)).toFixed(2)} {selectedIngredient.unite}</strong></div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowEntreeModal(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={enregistrerEntree}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configuration */}
      {showConfigModal && selectedIngredient && (
        <ConfigModal
          ingredient={selectedIngredient}
          onSave={saveConfig}
          onClose={() => setShowConfigModal(false)}
        />
      )}

      {/* Modal Historique */}
      {showHistoriqueModal && selectedIngredient && (
        <HistoriqueModal
          ingredient={selectedIngredient}
          onClose={() => setShowHistoriqueModal(false)}
        />
      )}
    </div>
  );
};

/**
 * Modal de configuration des seuils
 */
const ConfigModal = ({ ingredient, onSave, onClose }) => {
  const [config, setConfig] = useState({
    stockActuel: ingredient.stockActuel || 0,
    stockCritique: ingredient.stockCritique || 2,
    stockMin: ingredient.stockMin || 5,
    stockMax: ingredient.stockMax || 20
  });

  const handleSave = () => {
    if (config.stockCritique >= config.stockMin) {
      alert('Le seuil critique doit être inférieur au seuil minimum.');
      return;
    }
    if (config.stockMin >= config.stockMax) {
      alert('Le seuil minimum doit être inférieur au stock maximum.');
      return;
    }
    onSave(config);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>⚙️ Configuration - {ingredient.nom}</h2>

        <div className="form-group">
          <label>Stock actuel *</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              step="0.01"
              value={config.stockActuel}
              onChange={(e) => setConfig({ ...config, stockActuel: e.target.value })}
            />
            <span style={{ alignSelf: 'center' }}>{ingredient.unite}</span>
          </div>
        </div>

        <div className="form-group">
          <label>🔴 Seuil critique *</label>
          <input
            type="number"
            step="0.01"
            value={config.stockCritique}
            onChange={(e) => setConfig({ ...config, stockCritique: e.target.value })}
            placeholder="Ex: 2"
          />
          <small>Alerte rouge si stock ≤ cette valeur</small>
        </div>

        <div className="form-group">
          <label>🟠 Seuil minimum *</label>
          <input
            type="number"
            step="0.01"
            value={config.stockMin}
            onChange={(e) => setConfig({ ...config, stockMin: e.target.value })}
            placeholder="Ex: 5"
          />
          <small>Alerte orange si stock ≤ cette valeur</small>
        </div>

        <div className="form-group">
          <label>Stock maximum souhaité *</label>
          <input
            type="number"
            step="0.01"
            value={config.stockMax}
            onChange={(e) => setConfig({ ...config, stockMax: e.target.value })}
            placeholder="Ex: 20"
          />
          <small>Pour calculer les quantités à commander</small>
        </div>

        <div className="config-preview">
          <div className="preview-bar">
            <div className="zone critical" style={{ width: `${(config.stockCritique / config.stockMax) * 100}%` }}>
              🔴 {config.stockCritique}
            </div>
            <div className="zone low" style={{ width: `${((config.stockMin - config.stockCritique) / config.stockMax) * 100}%` }}>
              🟠 {config.stockMin}
            </div>
            <div className="zone ok" style={{ width: `${((config.stockMax - config.stockMin) / config.stockMax) * 100}%` }}>
              🟢 {config.stockMax}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal d'historique des mouvements
 */
const HistoriqueModal = ({ ingredient, onClose }) => {
  const mouvements = ingredient.mouvements || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>📋 Historique - {ingredient.nom}</h2>

        {mouvements.length === 0 ? (
          <p className="empty-text">Aucun mouvement enregistré</p>
        ) : (
          <div className="historique-list">
            {mouvements.slice().reverse().map((mvt, index) => (
              <div key={index} className={`historique-item ${mvt.type}`}>
                <div className="mvt-header">
                  <span className="mvt-type">
                    {mvt.type === 'entrée' ? '➕' : '➖'} {mvt.type}
                  </span>
                  <span className="mvt-date">
                    {new Date(mvt.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="mvt-details">
                  <div>Quantité: <strong>{mvt.quantite} {ingredient.unite}</strong></div>
                  <div>Motif: {mvt.motif}</div>
                  {mvt.prixUnitaire && (
                    <div>Prix: {mvt.prixUnitaire.toFixed(2)}€/{ingredient.unite}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventaireTab;