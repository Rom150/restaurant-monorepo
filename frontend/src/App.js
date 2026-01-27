import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import MercurialeTab from './components/MercurialeTab';
import  FichesTechniquesTab  from './components/FichesTechniquesTab';
import InventaireTab from './components/InventaireTab';
import CaisseTab from './components/CaisseTab';
import './App.css';
import { demoIngredients, demoFiches } from './data/demoData';

/**
 * Application principale de gestion de restaurant
 * Gère la navigation entre mercuriale et fiches techniques
 */
function App() {
  const [activeTab, setActiveTab] = useState('mercuriale');
  const [ingredients, setIngredients] = useState([]);
  const [fiches, setFiches] = useState([]);

  // Chargement des données depuis localStorage au démarrage
  useEffect(() => {
    try {
      const savedIngredients = localStorage.getItem('restaurant_ingredients');
      const savedFiches = localStorage.getItem('restaurant_fiches');
      
      if (savedIngredients) {
        setIngredients(JSON.parse(savedIngredients));
      }
      if (savedFiches) {
        setFiches(JSON.parse(savedFiches));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  }, []);

  // Sauvegarde automatique des ingrédients
  useEffect(() => {
    try {
      localStorage.setItem('restaurant_ingredients', JSON.stringify(ingredients));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des ingrédients:', error);
    }
  }, [ingredients]);

  // Sauvegarde automatique des fiches
  useEffect(() => {
    try {
      localStorage.setItem('restaurant_fiches', JSON.stringify(fiches));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des fiches:', error);
    }
  }, [fiches]);

  // Fonction pour importer les données démo
  const importerDonneesDemo = () => {
    const ingredientsDemo = [
      { id: Date.now() + 1, nom: "Tomates", prix: 3.50, unite: "kg", allergenes: [], photo: null },
      { id: Date.now() + 2, nom: "Courgettes", prix: 2.80, unite: "kg", allergenes: [], photo: null },
      { id: Date.now() + 3, nom: "Aubergines", prix: 4.20, unite: "kg", allergenes: [], photo: null },
      { id: Date.now() + 4, nom: "Poivrons rouges", prix: 5.00, unite: "kg", allergenes: [], photo: null },
      { id: Date.now() + 5, nom: "Oignons", prix: 1.50, unite: "kg", allergenes: [], photo: null },
      { id: Date.now() + 6, nom: "Ail", prix: 8.00, unite: "kg", allergenes: [], photo: null },
      { id: Date.now() + 7, nom: "Poulet fermier", prix: 12.00, unite: "kg", allergenes: [], photo: null },
      { id: Date.now() + 8, nom: "Saumon frais", prix: 22.00, unite: "kg", allergenes: ["Poissons"], photo: null },
      { id: Date.now() + 9, nom: "Œufs bio", prix: 0.45, unite: "unité", allergenes: ["Œufs"], photo: null },
      { id: Date.now() + 10, nom: "Crevettes", prix: 18.00, unite: "kg", allergenes: ["Crustacés"], photo: null },
      { id: Date.now() + 11, nom: "Crème fraîche", prix: 4.50, unite: "L", allergenes: ["Lait"], photo: null },
      { id: Date.now() + 12, nom: "Beurre", prix: 8.00, unite: "kg", allergenes: ["Lait"], photo: null },
      { id: Date.now() + 13, nom: "Parmesan", prix: 24.00, unite: "kg", allergenes: ["Lait"], photo: null },
      { id: Date.now() + 14, nom: "Huile d'olive", prix: 12.00, unite: "L", allergenes: [], photo: null },
      { id: Date.now() + 15, nom: "Riz basmati", prix: 3.50, unite: "kg", allergenes: [], photo: null },
      { id: Date.now() + 16, nom: "Pâtes fraîches", prix: 6.00, unite: "kg", allergenes: ["Gluten", "Œufs"], photo: null },
      { id: Date.now() + 17, nom: "Thym", prix: 20.00, unite: "kg", allergenes: [], photo: null },
      { id: Date.now() + 18, nom: "Sel", prix: 2.00, unite: "kg", allergenes: [], photo: null },
      { id: Date.now() + 19, nom: "Poivre", prix: 25.00, unite: "kg", allergenes: [], photo: null }
    ];
const importDemoData = () => {
  if (window.confirm('Importer les données de démonstration ?\n\n• 22 ingrédients\n• 2 fiches techniques')) {
    // Vider le localStorage d'abord
    localStorage.removeItem('restaurant-ingredients');
    localStorage.removeItem('restaurant-fiches');
    
    // Importer les nouvelles données
    setIngredients(demoIngredients);
    setFiches(demoFiches);
    
    alert('✅ Données importées !');
    
    // Recharger pour être sûr
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
};
    setIngredients(ingredientsDemo);
    alert('✅ 19 ingrédients importés ! Vous pouvez maintenant créer des fiches.');
  };
const importDemoData = () => {
  if (window.confirm('Importer les données de démonstration ?')) {
    setIngredients(demoIngredients);
    setFiches(demoFiches);
    alert('✅ Données importées !');
  }
};
  return (
    <div className="app">
      {/* En-tête */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <ShoppingCart size={36} />
            <div>
              <h1>Gestion Restaurant Pro</h1>
              <p className="header-subtitle">
                Solution complète pour vos fiches techniques & mercuriale
              </p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{ingredients.length}</span>
              <span className="stat-label">Ingrédients</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{fiches.length}</span>
              <span className="stat-label">Fiches</span>
            </div>
            {ingredients.length === 0 && (
              <button 
                onClick={importerDonneesDemo}
                style={{
                  background: 'white',
                  color: '#f97316',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📦 Importer données démo
              </button>
            )}
          </div>
        </div>
        <div className="header-right">
  <div className="header-stats">
    <div className="stat-item">
      <span className="stat-value">{ingredients.length}</span>
      <span className="stat-label">Ingrédients</span>
    </div>
    <div className="stat-item">
      <span className="stat-value">{fiches.length}</span>
      <span className="stat-label">Fiches</span>
    </div>
  </div>
  
  {/* NOUVEAU BOUTON ICI */}
  <button 
    className="btn-secondary"
    onClick={importDemoData}
    style={{ marginLeft: '16px' }}
  >
    📦 Importer données démo
  </button>
</div>
      </header>

      {/* Navigation */}
<nav className="app-nav">
  <button
    className={activeTab === 'mercuriale' ? 'active' : ''}
    onClick={() => setActiveTab('mercuriale')}
  >
    <span className="nav-icon">🛒</span>
    <span>Mercuriale</span>
    <span className="nav-badge">{ingredients.length}</span>
  </button>

  <button
    className={activeTab === 'fiches' ? 'active' : ''}
    onClick={() => setActiveTab('fiches')}
  >
    <span className="nav-icon">📋</span>
    <span>Fiches Techniques</span>
    <span className="nav-badge">{fiches.length}</span>
  </button>

  <button
    className={activeTab === 'inventaire' ? 'active' : ''}
    onClick={() => setActiveTab('inventaire')}
  >
    <span className="nav-icon">📦</span>
    <span>Inventaire</span>
    <span className="nav-badge">{ingredients.length}</span>
  </button>

  <button
    className={activeTab === 'caisse' ? 'active' : ''}
    onClick={() => setActiveTab('caisse')}
  >
    <span className="nav-icon">💳</span>
    <span>Caisse</span>
  </button>
</nav>

      {/* Contenu principal */}
      <main className="app-main">
        {activeTab === 'mercuriale' ? (
          <MercurialeTab 
            ingredients={ingredients} 
            setIngredients={setIngredients} 
          />
        ) : (
          <FichesTechniquesTab
            ingredients={ingredients}
            fiches={fiches}
            setFiches={setFiches}
          />
        )}
       {activeTab === 'inventaire' && (
  <InventaireTab
    ingredients={ingredients}
    setIngredients={setIngredients}
    fiches={fiches}
  />
)}

{activeTab === 'caisse' && (
  <CaisseTab
    fiches={fiches}
    ingredients={ingredients}
    setIngredients={setIngredients}
  />
)}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 Gestion Restaurant Pro - Tous droits réservés</p>
        <p className="footer-version">Version 1.0.0</p>
      </footer>
    </div>
  );
}

export default App;