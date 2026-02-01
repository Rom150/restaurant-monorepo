import React, { useState, useMemo } from 'react';
import { ShoppingBag, AlertCircle, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';

const CaisseTab = ({ fiches, ingredients, setIngredients }) => {
  const [ventes, setVentes] = useState([]);
  const [showVenteModal, setShowVenteModal] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState(null);
  const [quantiteVente, setQuantiteVente] = useState(1);

  /**
   * Vérifie si une fiche peut être préparée avec le stock actuel
   */
  const verifierStock = (fiche) => {
    const manquants = [];
    
    fiche.ingredients.forEach(ing => {
      const stockDispo = ingredients.find(i => i.id === ing.id)?.stockActuel || 0;
      const necessaire = ing.quantite || 0;
      
      if (stockDispo < necessaire) {
        manquants.push({
          nom: ing.nom,
          disponible: stockDispo,
          necessaire: necessaire,
          manque: necessaire - stockDispo
        });
      }
    });

    return {
      possible: manquants.length === 0,
      manquants: manquants
    };
  };

  /**
   * Calcule les statistiques de la journée
   */
  const statsJour = useMemo(() => {
    const aujourdhui = new Date().toDateString();
    const ventesJour = ventes.filter(v => new Date(v.date).toDateString() === aujourdhui);
    
    return {
      nombreVentes: ventesJour.length,
      ca: ventesJour.reduce((sum, v) => sum + v.montantTotal, 0),
      platsPlusVendus: ventesJour.reduce((acc, v) => {
        acc[v.nomPlat] = (acc[v.nomPlat] || 0) + v.quantite;
        return acc;
      }, {})
    };
  }, [ventes]);

  /**
   * Ouvre la modal de vente
   */
  const openVenteModal = (fiche) => {
    const verification = verifierStock(fiche);
    
    if (!verification.possible) {
      const message = `⚠️ Stock insuffisant pour préparer ${fiche.nom}:\n\n` +
        verification.manquants.map(m => 
          `• ${m.nom}: ${m.disponible.toFixed(2)} dispo, ${m.necessaire.toFixed(2)} nécessaire (manque ${m.manque.toFixed(2)})`
        ).join('\n');
      
      alert(message);
      return;
    }

    setSelectedFiche(fiche);
    setQuantiteVente(1);
    setShowVenteModal(true);
  };

  /**
   * Calcule le coût et prix de vente
   */
  const calculerPrix = (fiche) => {
    const coutTotal = fiche.ingredients.reduce((sum, ing) => {
      return sum + (ing.prix * ing.quantite);
    }, 0);
    
    const coutParPortion = fiche.portions > 0 ? coutTotal / fiche.portions : 0;
    
    // Prix de vente: utiliser le prix défini ou coût × 3
    const prixVenteParPortion = fiche.prixVente || (coutParPortion * 3);
    
    return {
      cout: coutTotal,
      coutPortion: coutParPortion,
      prixVente: prixVenteParPortion,
      marge: prixVenteParPortion > 0 ? ((prixVenteParPortion - coutParPortion) / prixVenteParPortion * 100) : 0
    };
  };

  /**
   * Enregistre une vente et déduit les stocks
   */
  const enregistrerVente = () => {
    if (quantiteVente <= 0) {
      alert('Veuillez saisir une quantité valide.');
      return;
    }

    // Vérifier à nouveau le stock avec la quantité demandée
    const verification = verifierStockAvecQuantite(selectedFiche, quantiteVente);
    if (!verification.possible) {
      alert('Stock insuffisant pour cette quantité.');
      return;
    }

    const prix = calculerPrix(selectedFiche);
    const montantTotal = prix.prixVente * quantiteVente;

    // Créer la vente
    const vente = {
      id: Date.now(),
      date: new Date().toISOString(),
      ficheId: selectedFiche.id,
      nomPlat: selectedFiche.nom,
      quantite: quantiteVente,
      prixUnitaire: prix.prixVente,
      montantTotal: montantTotal,
      deductions: []
    };

    // Déduire les stocks
    const updatedIngredients = ingredients.map(ing => {
      const ficheIng = selectedFiche.ingredients.find(fi => fi.id === ing.id);
      
      if (ficheIng) {
        const quantiteADeduire = ficheIng.quantite * quantiteVente;
        const nouveauStock = (ing.stockActuel || 0) - quantiteADeduire;

        // Enregistrer le mouvement
        const mouvement = {
          date: new Date().toISOString(),
          type: 'sortie',
          quantite: quantiteADeduire,
          motif: `Vente: ${selectedFiche.nom} x${quantiteVente}`,
          ficheId: selectedFiche.id
        };

        // Ajouter à la liste des déductions
        vente.deductions.push({
          ingredientId: ing.id,
          nom: ing.nom,
          quantite: quantiteADeduire,
          unite: ing.unite
        });

        return {
          ...ing,
          stockActuel: Math.max(0, nouveauStock),
          mouvements: [...(ing.mouvements || []), mouvement]
        };
      }
      
      return ing;
    });

    // Mettre à jour
    setIngredients(updatedIngredients);
    setVentes([...ventes, vente]);

    // Vérifier les alertes
    const alertes = updatedIngredients
      .filter(ing => (ing.stockActuel || 0) <= (ing.stockCritique || 0))
      .map(ing => `🔴 ${ing.nom}: ${(ing.stockActuel || 0).toFixed(2)} ${ing.unite}`);

    if (alertes.length > 0) {
      setTimeout(() => {
        alert(`✅ Vente enregistrée !\n\n⚠️ ALERTES STOCK:\n\n${alertes.join('\n')}`);
      }, 500);
    } else {
      alert(`✅ Vente enregistrée !\n\n${selectedFiche.nom} x${quantiteVente}\nMontant: ${montantTotal.toFixed(2)}€`);
    }

    setShowVenteModal(false);
  };

  /**
   * Vérifie le stock pour une quantité spécifique
   */
  const verifierStockAvecQuantite = (fiche, quantite) => {
    const manquants = [];
    
    fiche.ingredients.forEach(ing => {
      const stockDispo = ingredients.find(i => i.id === ing.id)?.stockActuel || 0;
      const necessaire = (ing.quantite || 0) * quantite;
      
      if (stockDispo < necessaire) {
        manquants.push({
          nom: ing.nom,
          disponible: stockDispo,
          necessaire: necessaire
        });
      }
    });

    return {
      possible: manquants.length === 0,
      manquants: manquants
    };
  };

  return (
    <div className="tab-content">
      {/* Statistiques du jour */}
      <div className="card">
        <h2 className="card-title">💳 Caisse - Statistiques du jour</h2>
        
        <div className="caisse-stats">
          <div className="stat-card">
            <div className="stat-icon">🛍️</div>
            <div className="stat-content">
              <div className="stat-value">{statsJour.nombreVentes}</div>
              <div className="stat-label">Ventes</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">{statsJour.ca.toFixed(2)}€</div>
              <div className="stat-label">Chiffre d'affaires</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">
                {statsJour.nombreVentes > 0 ? (statsJour.ca / statsJour.nombreVentes).toFixed(2) + '€' : '0€'}
              </div>
              <div className="stat-label">Panier moyen</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fiches disponibles */}
      <div className="card">
        <h2 className="card-title">🍽️ Menu ({fiches.length} plats)</h2>

        {fiches.length === 0 ? (
          <p className="empty-text">
            Aucune fiche technique.
            <span className="empty-hint">Créez vos premières fiches dans l'onglet "Fiches Techniques"</span>
          </p>
        ) : (
          <div className="menu-grid">
            {fiches.map(fiche => {
              const verification = verifierStock(fiche);
              const prix = calculerPrix(fiche);
              
              return (
                <div key={fiche.id} className={`menu-card ${!verification.possible ? 'rupture' : ''}`}>
                  {fiche.photo && (
                    <img src={fiche.photo} alt={fiche.nom} className="menu-photo" />
                  )}
                  
                  <div className="menu-content">
                    <h3>{fiche.nom}</h3>
                    
                    <div className="menu-info">
                      <div className="info-row">
                        <span>👥 {fiche.portions} portions</span>
                      </div>
                      <div className="info-row">
                        <span>💰 Prix: <strong>{prix.prixVente.toFixed(2)}€</strong></span>
                      </div>
                      <div className="info-row">
                        <span>📊 Marge: {prix.marge.toFixed(0)}%</span>
                      </div>
                    </div>

                    {verification.possible ? (
                      <div className="stock-status ok">
                        <CheckCircle size={16} />
                        Stock disponible
                      </div>
                    ) : (
                      <div className="stock-status rupture">
                        <AlertCircle size={16} />
                        Rupture de stock
                      </div>
                    )}

                    <button 
                      className={`btn-primary ${!verification.possible ? 'disabled' : ''}`}
                      onClick={() => openVenteModal(fiche)}
                      disabled={!verification.possible}
                    >
                      <ShoppingBag size={18} />
                      {verification.possible ? 'Vendre' : 'Rupture'}
                    </button>

                    {!verification.possible && (
                      <div className="manquants-list">
                        <strong>Manque:</strong>
                        {verification.manquants.slice(0, 2).map((m, i) => (
                          <div key={i}>• {m.nom}: {m.manque.toFixed(2)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historique des ventes */}
      {ventes.length > 0 && (
        <div className="card">
          <h2 className="card-title">📋 Dernières ventes</h2>
          
          <div className="ventes-list">
            {ventes.slice().reverse().slice(0, 10).map(vente => (
              <div key={vente.id} className="vente-item">
                <div className="vente-header">
                  <strong>{vente.nomPlat}</strong>
                  <span className="vente-montant">{vente.montantTotal.toFixed(2)}€</span>
                </div>
                <div className="vente-details">
                  <span>Quantité: {vente.quantite}</span>
                  <span>{new Date(vente.date).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de vente */}
      {showVenteModal && selectedFiche && (
        <div className="modal-overlay" onClick={() => setShowVenteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🛍️ Vente</h2>
            <h3>{selectedFiche.nom}</h3>

            <div className="vente-preview">
              {selectedFiche.photo && (
                <img src={selectedFiche.photo} alt={selectedFiche.nom} style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }} />
              )}
              
              <div className="prix-info">
                <div>Prix unitaire: <strong>{calculerPrix(selectedFiche).prixVente.toFixed(2)}€</strong></div>
                <div>Coût: {calculerPrix(selectedFiche).coutPortion.toFixed(2)}€</div>
                <div>Marge: {calculerPrix(selectedFiche).marge.toFixed(0)}%</div>
              </div>
            </div>

            <div className="form-group">
              <label>Quantité de portions *</label>
              <input
                type="number"
                min="1"
                value={quantiteVente}
                onChange={(e) => setQuantiteVente(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="vente-total">
              <strong>TOTAL: {(calculerPrix(selectedFiche).prixVente * quantiteVente).toFixed(2)}€</strong>
            </div>

            <div className="ingredients-deduction">
              <h4>Déductions de stock:</h4>
              {selectedFiche.ingredients.map(ing => {
                const qte = ing.quantite * quantiteVente;
                const stockActuel = ingredients.find(i => i.id === ing.id)?.stockActuel || 0;
                const nouveauStock = stockActuel - qte;
                
                return (
                  <div key={ing.id} className="deduction-item">
                    <span>{ing.nom}</span>
                    <span>{stockActuel.toFixed(2)} → {Math.max(0, nouveauStock).toFixed(2)} {ing.unite}</span>
                  </div>
                );
              })}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowVenteModal(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={enregistrerVente}>
                Confirmer la vente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaisseTab;