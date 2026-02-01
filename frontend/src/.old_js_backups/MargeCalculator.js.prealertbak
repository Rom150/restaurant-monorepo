import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

/**
 * Calculateur de marge avancé
 * Permet de calculer différents scénarios de prix et marges
 */
function MargeCalculator({ fiche, ratios }) {
  const [prixVente, setPrixVente] = useState(ratios.prixVenteConseille.toFixed(2));
  const [coefficient, setCoefficient] = useState('3');

  // Mise à jour du prix quand le coefficient change
  useEffect(() => {
    if (coefficient && !isNaN(parseFloat(coefficient))) {
      const newPrice = (ratios.coutParPortion * parseFloat(coefficient)).toFixed(2);
      setPrixVente(newPrice);
    }
  }, [coefficient, ratios.coutParPortion]);

  /**
   * Calcule le prix basé sur le coefficient
   */
  const calculatedPrice = (ratios.coutParPortion * parseFloat(coefficient || 3)).toFixed(2);

  /**
   * Calcule la marge brute en %
   * Formule: ((PV - Coût) / PV) * 100
   */
  const customMargin = prixVente && parseFloat(prixVente) > 0
    ? (((parseFloat(prixVente) - ratios.coutParPortion) / parseFloat(prixVente)) * 100).toFixed(1)
    : 0;

  /**
   * Calcule le ratio coût matière en %
   * Formule: (Coût / PV) * 100
   */
  const customRatio = prixVente && parseFloat(prixVente) > 0
    ? ((ratios.coutParPortion / parseFloat(prixVente)) * 100).toFixed(1)
    : 0;

  /**
   * Calcule le bénéfice par portion
   */
  const beneficeParPortion = prixVente && parseFloat(prixVente) > 0
    ? (parseFloat(prixVente) - ratios.coutParPortion).toFixed(2)
    : 0;

  /**
   * Applique un coefficient prédéfini
   */
  const applyCoefficient = (coef) => {
    setCoefficient(coef.toString());
    const newPrice = (ratios.coutParPortion * coef).toFixed(2);
    setPrixVente(newPrice);
  };

  /**
   * Détermine la qualité du ratio (bon, acceptable, élevé)
   */
  const getRatioQuality = () => {
    const ratio = parseFloat(customRatio);
    if (ratio <= 30) return { text: '✅ Excellent ratio (≤30%)', color: 'green' };
    if (ratio <= 35) return { text: '✅ Bon ratio (30-35%)', color: 'green' };
    if (ratio <= 40) return { text: '⚠️ Ratio acceptable (35-40%)', color: 'orange' };
    return { text: '❌ Ratio élevé (>40%)', color: 'red' };
  };

  const ratioQuality = getRatioQuality();

  return (
    <div className="marge-calculator">
      <h4 className="calculator-title">
        <TrendingUp className="text-orange" />
        Calculateur de Marge Avancé
      </h4>

      <div className="calculator-grid">
        {/* Section Inputs */}
        <div className="calculator-section">
          <div className="form-group">
            <label className="calculator-label">
              Prix de vente souhaité (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={prixVente}
              onChange={(e) => setPrixVente(e.target.value)}
              className="input input-large"
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label className="calculator-label">
              Coefficient multiplicateur
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={coefficient}
              onChange={(e) => setCoefficient(e.target.value)}
              className="input input-large"
              placeholder="3"
            />
            <p className="calculator-hint">
              Prix calculé: {calculatedPrice} €
            </p>
          </div>

          {/* Boutons coefficients rapides */}
          <div className="coefficient-buttons">
            <button
              onClick={() => applyCoefficient(2.5)}
              className="btn-coefficient"
            >
              x2.5
            </button>
            <button
              onClick={() => applyCoefficient(3)}
              className="btn-coefficient btn-coefficient-primary"
            >
              x3
            </button>
            <button
              onClick={() => applyCoefficient(3.5)}
              className="btn-coefficient"
            >
              x3.5
            </button>
            <button
              onClick={() => applyCoefficient(4)}
              className="btn-coefficient"
            >
              x4
            </button>
          </div>
        </div>

        {/* Section Résultats */}
        <div className="calculator-section results-section">
          <h5 className="results-title">Résultats</h5>
          <div className="results-grid">
            <div className="result-item">
              <span className="result-label">Coût portion:</span>
              <span className="result-value">{ratios.coutParPortion.toFixed(2)} €</span>
            </div>
            <div className="result-item">
              <span className="result-label">Prix de vente:</span>
              <span className="result-value result-highlight">{parseFloat(prixVente).toFixed(2)} €</span>
            </div>
            <div className="result-item result-main">
              <span className="result-label">Bénéfice/portion:</span>
              <span className="result-value result-success">+{beneficeParPortion} €</span>
            </div>
            <div className="result-item">
              <span className="result-label">Marge brute:</span>
              <span className="result-value result-success">{customMargin} %</span>
            </div>
            <div className="result-item">
              <span className="result-label">Ratio coût:</span>
              <span className={`result-value ${parseFloat(customRatio) <= 33 ? 'result-success' : 'result-warning'}`}>
                {customRatio} %
              </span>
            </div>
          </div>

          <div className={`ratio-indicator ratio-${ratioQuality.color}`}>
            {ratioQuality.text}
          </div>
        </div>
      </div>

      {/* Section Simulations */}
      <div className="simulation-section">
        <h5 className="simulation-title">💡 Simulations pour {fiche.portions} portions</h5>
        <div className="simulation-grid">
          <div className="simulation-item">
            <span className="simulation-label">Chiffre d'affaires:</span>
            <span className="simulation-value">
              {(parseFloat(prixVente) * fiche.portions).toFixed(2)} €
            </span>
          </div>
          <div className="simulation-item">
            <span className="simulation-label">Coût total matière:</span>
            <span className="simulation-value">
              {ratios.coutTotal.toFixed(2)} €
            </span>
          </div>
          <div className="simulation-item">
            <span className="simulation-label">Bénéfice total:</span>
            <span className="simulation-value simulation-success">
              +{(parseFloat(beneficeParPortion) * fiche.portions).toFixed(2)} €
            </span>
          </div>
        </div>
      </div>

      {/* Section Info / Conseils */}
      <div className="calculator-info">
        <h5>📊 Guide des ratios</h5>
        <ul className="info-list">
          <li><strong>≤ 30%</strong> : Excellent - Marge très confortable</li>
          <li><strong>30-35%</strong> : Bon - Marge standard en restauration</li>
          <li><strong>35-40%</strong> : Acceptable - Attention à l'optimisation</li>
          <li><strong>&gt; 40%</strong> : Élevé - Réviser le prix ou les coûts</li>
        </ul>
      </div>
    </div>
  );
}

export default MargeCalculator;