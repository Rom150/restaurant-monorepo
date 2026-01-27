/**
 * IMPORT FICHES TECHNIQUES - OCR
 * 
 * Permet d'importer des fiches techniques depuis :
 * - Photos de recettes
 * - PDF de fiches
 * - Images de recettes manuscrites ou imprimées
 */

import Tesseract from 'tesseract.js';

// Charger PDF.js via CDN
const loadPDFJS = async () => {
  if (window.pdfjsLib) return window.pdfjsLib;
  
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  
  return window.pdfjsLib;
};

// =====================================================
// EXTRACTION PDF
// =====================================================

const extractPDFText = async (file) => {
  console.log('📄 Extraction PDF...');
  const pdfjsLib = await loadPDFJS();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        console.log('✅ PDF extrait');
        resolve(fullText);
      } catch (error) {
        console.error('❌ Erreur PDF:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erreur lecture'));
    reader.readAsArrayBuffer(file);
  });
};

// =====================================================
// OCR IMAGES
// =====================================================

const preprocessImage = async (file) => {
  console.log('🖼️ Prétraitement image...');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const scale = 3;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const val = avg > 140 ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = val;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => reject(new Error('Erreur image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Erreur lecture'));
    reader.readAsDataURL(file);
  });
};

const performOCR = async (imageData, onProgress) => {
  console.log('🔍 OCR...');
  
  const result = await Tesseract.recognize(
    imageData,
    'fra',
    {
      logger: m => {
        if (m.status === 'recognizing text') {
          const percent = Math.round(m.progress * 100);
          if (onProgress) onProgress(`OCR ${percent}%`, 0.2 + (m.progress * 0.6));
        }
      }
    }
  );
  
  console.log('✅ OCR terminé');
  return result.data.text;
};

// =====================================================
// EXTRACTION
// =====================================================

const extractTextFromFile = async (file, onProgress) => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 EXTRACTION FICHE TECHNIQUE');
  console.log('═══════════════════════════════════════');
  
  try {
    if (file.type === 'application/pdf') {
      if (onProgress) onProgress('Extraction PDF...', 0.1);
      return await extractPDFText(file);
    } else {
      if (onProgress) onProgress('Prétraitement...', 0.1);
      const img = await preprocessImage(file);
      return await performOCR(img, onProgress);
    }
  } catch (error) {
    console.error('❌', error);
    throw error;
  }
};

// =====================================================
// PARSING RECETTE
// =====================================================

const parseRecipeFromText = (text) => {
  console.log('═══════════════════════════════════════');
  console.log('🔍 PARSING RECETTE');
  console.log('═══════════════════════════════════════');
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  console.log(`📋 ${lines.length} lignes`);
  
  const recipe = {
    nom: '',
    portions: 4,
    ingredients: [],
    instructions: '',
    cout: 0,
    prixVente: 0,
    categorie: 'Plat'
  };
  
  // ÉTAPE 1 : Trouver le nom (première ligne significative)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    
    // Le nom est généralement court et sans chiffres
    if (line.length > 3 && line.length < 100 && !line.match(/^\d/) && !line.match(/ingrédient|préparation|recette/i)) {
      recipe.nom = line;
      console.log(`📝 Nom: "${recipe.nom}"`);
      break;
    }
  }
  
  // ÉTAPE 2 : Extraire les ingrédients
  let inIngredients = false;
  let inInstructions = false;
  let instructions = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (i < 20) console.log(`${i}: "${line}"`);
    
    // Détection section ingrédients
    if (line.match(/^(ingrédient|ingredient|pour\s+\d+\s+personne)/i)) {
      inIngredients = true;
      inInstructions = false;
      
      // Extraire le nombre de portions
      const portionsMatch = line.match(/(\d+)\s+personne/i);
      if (portionsMatch) {
        recipe.portions = parseInt(portionsMatch[1]);
        console.log(`👥 Portions: ${recipe.portions}`);
      }
      continue;
    }
    
    // Détection section instructions
    if (line.match(/^(préparation|instruction|étape|réalisation)/i)) {
      inIngredients = false;
      inInstructions = true;
      continue;
    }
    
    // Parser ingrédients
    if (inIngredients) {
      const ingredient = parseIngredientLine(line);
      if (ingredient) {
        recipe.ingredients.push(ingredient);
        console.log(`  ✅ ${ingredient.nom} ${ingredient.quantite}${ingredient.unite}`);
      }
    }
    
    // Parser instructions
    if (inInstructions && line.length > 10) {
      instructions.push(line);
    }
  }
  
  recipe.instructions = instructions.join('\n');
  
  console.log('═══════════════════════════════════════');
  console.log(`📝 Nom: "${recipe.nom}"`);
  console.log(`🥘 ${recipe.ingredients.length} ingrédients`);
  console.log(`📖 ${instructions.length} étapes`);
  console.log('═══════════════════════════════════════');
  
  return recipe;
};

const parseIngredientLine = (line) => {
  // Pattern : "Quantité Unité Nom"
  // Ex: "250 g farine", "2 L lait", "3 oeufs"
  
  const pattern1 = /^([\d]+(?:[,\.]\d+)?)\s*(g|kg|l|ml|cl|piece|pièce|unité|unite|c\.?\s*à\s*s|c\.?\s*à\s*c|cs|cc)?\s+(.+)$/i;
  const match1 = line.match(pattern1);
  
  if (match1) {
    const [, qte, unite, nom] = match1;
    return {
      nom: nom.trim(),
      quantite: parseFloat(qte.replace(',', '.')),
      unite: normalizeUnit(unite || 'unité')
    };
  }
  
  // Pattern 2 : "Nom Quantité Unité"
  // Ex: "Farine 250 g", "Lait 2 L"
  const pattern2 = /^(.+?)\s+([\d]+(?:[,\.]\d+)?)\s*(g|kg|l|ml|cl|piece|pièce|unité|unite)$/i;
  const match2 = line.match(pattern2);
  
  if (match2) {
    const [, nom, qte, unite] = match2;
    return {
      nom: nom.trim(),
      quantite: parseFloat(qte.replace(',', '.')),
      unite: normalizeUnit(unite)
    };
  }
  
  return null;
};

const normalizeUnit = (unit) => {
  if (!unit) return 'unité';
  
  const map = {
    'g': 'g',
    'kg': 'kg',
    'l': 'L',
    'ml': 'ml',
    'cl': 'cl',
    'piece': 'pièce',
    'pièce': 'pièce',
    'unite': 'unité',
    'unité': 'unité',
    'c.à.s': 'c.à.s',
    'cas': 'c.à.s',
    'cs': 'c.à.s',
    'c.à.c': 'c.à.c',
    'cac': 'c.à.c',
    'cc': 'c.à.c'
  };
  
  const normalized = unit.toLowerCase().replace(/\s+/g, '.');
  return map[normalized] || unit;
};

// =====================================================
// IMPORT PRINCIPAL
// =====================================================

export const importFicheTechnique = async (file, onProgress) => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 IMPORT FICHE TECHNIQUE');
  console.log('═══════════════════════════════════════');
  
  try {
    // ÉTAPE 1 : Extraction texte
    if (onProgress) onProgress('Extraction...', 0.1);
    const text = await extractTextFromFile(file, onProgress);
    
    if (!text || text.length < 20) {
      throw new Error('Fichier vide ou illisible');
    }
    
    // ÉTAPE 2 : Parsing
    if (onProgress) onProgress('Analyse...', 0.8);
    const recipe = parseRecipeFromText(text);
    
    if (!recipe.nom) {
      throw new Error('Impossible de détecter le nom de la recette');
    }
    
    if (recipe.ingredients.length === 0) {
      throw new Error('Aucun ingrédient détecté');
    }
    
    if (onProgress) onProgress('Terminé', 1.0);
    
    console.log('✅ Import réussi');
    return recipe;
    
  } catch (error) {
    console.error('❌', error);
    throw error;
  }
};

// =====================================================
// VALIDATION
// =====================================================

export const validateRecipe = (recipe) => {
  const errors = [];
  
  if (!recipe.nom || recipe.nom.length < 2) {
    errors.push('Nom de la recette manquant');
  }
  
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    errors.push('Aucun ingrédient');
  }
  
  if (recipe.portions < 1) {
    errors.push('Nombre de portions invalide');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// =====================================================
// DÉTECTION DOUBLONS
// =====================================================

export const detectDuplicateRecipes = (existingRecipes, newRecipe) => {
  const duplicates = [];
  
  for (const existing of existingRecipes) {
    const similarity = calculateSimilarity(existing.nom, newRecipe.nom);
    
    if (similarity > 0.8) {
      duplicates.push({
        existing,
        similarity: Math.round(similarity * 100)
      });
    }
  }
  
  return duplicates;
};

const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};