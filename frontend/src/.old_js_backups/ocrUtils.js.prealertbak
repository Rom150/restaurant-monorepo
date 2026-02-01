/**
 * Utilitaire OCR pour extraire les données des factures
 * Utilise Tesseract.js pour la reconnaissance de texte
 */

/**
 * Extrait le texte d'une image ou PDF
 * @param {File} file - Fichier image ou PDF
 * @returns {Promise<string>} - Texte extrait
 */
export const extractTextFromFile = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      // Simulation OCR - remplacer par Tesseract.js en production
      setTimeout(() => {
        const simulatedText = `
          FACTURE FOURNISSEUR
          Date: 15/01/2026
          
          Tomates cerises       2.5 kg    4.20 €/kg    10.50 €
          Pommes de terre       5.0 kg    1.80 €/kg     9.00 €
          Carottes bio          3.0 kg    2.50 €/kg     7.50 €
          Salade                4.0 unité 1.20 €/unité  4.80 €
          Bœuf haché           1.5 kg   15.00 €/kg    22.50 €
          Poulet entier        2.0 kg   10.50 €/kg    21.00 €
          Crème liquide        1.0 L     3.80 €/L      3.80 €
          Beurre doux          0.5 kg    7.00 €/kg     3.50 €
          
          TOTAL: 82.60 €
        `;
        resolve(simulatedText);
      }, 1500);
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Parse le texte extrait pour identifier les ingrédients
 * @param {string} text - Texte brut extrait de la facture
 * @returns {Array} - Liste d'ingrédients détectés
 */
export const parseInvoiceText = (text) => {
  const ingredients = [];
  const lines = text.split('\n');
  
  const productRegex = /^([A-Za-zÀ-ÿ\s]+)\s+(\d+\.?\d*)\s*(kg|L|mL|g|unité)\s+(\d+\.?\d*)\s*€/i;
  
  lines.forEach(line => {
    const match = line.match(productRegex);
    if (match) {
      const [, nom, , unite, prix] = match;
      
      const nomClean = nom.trim();
      const prixFloat = parseFloat(prix);
      const uniteClean = unite.toLowerCase();
      
      if (nomClean && prixFloat > 0) {
        ingredients.push({
          nom: nomClean,
          prix: prixFloat,
          unite: uniteClean === 'unité' ? 'unité' : uniteClean,
          allergenes: detectAllergenes(nomClean)
        });
      }
    }
  });
  
  return ingredients;
};

/**
 * Détecte automatiquement les allergènes potentiels
 * @param {string} nomProduit - Nom du produit
 * @returns {Array} - Liste des allergènes détectés
 */
const detectAllergenes = (nomProduit) => {
  const nom = nomProduit.toLowerCase();
  const allergenes = [];
  
  const allergenesMap = {
    'Gluten': ['blé', 'farine', 'pain', 'pâte', 'semoule', 'orge', 'seigle'],
    'Crustacés': ['crevette', 'crabe', 'homard', 'langouste', 'écrevisse'],
    'Œufs': ['œuf', 'oeuf'],
    'Poissons': ['poisson', 'saumon', 'thon', 'cabillaud', 'truite', 'bar', 'daurade'],
    'Arachides': ['arachide', 'cacahuète'],
    'Soja': ['soja', 'tofu'],
    'Lait': ['lait', 'crème', 'beurre', 'fromage', 'yaourt', 'parmesan', 'mozzarella'],
    'Fruits à coque': ['amande', 'noisette', 'noix', 'cajou', 'pistache', 'pécan'],
    'Céleri': ['céleri'],
    'Moutarde': ['moutarde'],
    'Sésame': ['sésame'],
    'Sulfites': ['vin', 'vinaigre'],
    'Lupin': ['lupin'],
    'Mollusques': ['moule', 'huître', 'coque', 'calmar', 'seiche', 'escargot']
  };
  
  Object.keys(allergenesMap).forEach(allergene => {
    const keywords = allergenesMap[allergene];
    if (keywords.some(keyword => nom.includes(keyword))) {
      allergenes.push(allergene);
    }
  });
  
  return allergenes;
};

/**
 * Fonction principale d'import de facture
 * @param {File} file - Fichier facture (image ou PDF)
 * @returns {Promise<Array>} - Liste d'ingrédients extraits
 */
export const importInvoice = async (file) => {
  try {
    const text = await extractTextFromFile(file);
    const ingredients = parseInvoiceText(text);
    
    if (ingredients.length === 0) {
      throw new Error('Aucun ingrédient détecté dans la facture');
    }
    
    return ingredients;
    
  } catch (error) {
    console.error('Erreur lors de l\'import de la facture:', error);
    throw error;
  }
};

/**
 * Valide et nettoie les données extraites
 * @param {Array} ingredients - Ingrédients bruts extraits
 * @returns {Array} - Ingrédients validés et nettoyés
 */
export const validateAndCleanIngredients = (ingredients) => {
  return ingredients.filter(ing => {
    return ing.nom && 
           ing.prix > 0 && 
           ing.unite && 
           ['kg', 'g', 'L', 'mL', 'unité'].includes(ing.unite);
  }).map(ing => ({
    ...ing,
    id: Date.now() + Math.random(),
    nom: ing.nom.charAt(0).toUpperCase() + ing.nom.slice(1),
    photo: null
  }));
};

/**
 * Détecte les doublons et gère la mise à jour des prix
 * @param {Array} existingIngredients - Ingrédients actuels
 * @param {Array} newIngredients - Nouveaux ingrédients à importer
 * @returns {Object} - Résultat avec doublons et nouveaux
 */
export const detectDuplicatesAndPriceChanges = (existingIngredients, newIngredients) => {
  const duplicates = [];
  const toAdd = [];
  
  newIngredients.forEach(newIng => {
    const normalizedNewName = newIng.nom.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const existing = existingIngredients.find(existingIng => {
      const normalizedExistingName = existingIng.nom.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizedExistingName === normalizedNewName;
    });
    
    if (existing) {
      const priceDifference = newIng.prix - existing.prix;
      const priceChangePercent = ((priceDifference / existing.prix) * 100).toFixed(1);
      
      duplicates.push({
        existing: existing,
        new: newIng,
        priceDifference: priceDifference,
        priceChangePercent: priceChangePercent
      });
    } else {
      toAdd.push(newIng);
    }
  });
  
  return { duplicates, toAdd };
};