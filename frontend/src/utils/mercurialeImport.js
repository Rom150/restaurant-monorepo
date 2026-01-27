/**
 * IMPORT MERCURIALE - VERSION QUI FONCTIONNE VRAIMENT
 * 
 * PDF : Utilise PDF.js via CDN (pas d'installation)
 * Images : Utilise Tesseract OCR
 */

import Tesseract from 'tesseract.js';

// Charger PDF.js via CDN
const loadPDFJS = async () => {
  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }
  
  // Charger le script
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  
  // Configurer le worker
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  
  return window.pdfjsLib;
};

// =====================================================
// EXTRACTION PDF
// =====================================================

const extractPDFText = async (file) => {
  console.log('📄 Chargement PDF.js...');
  const pdfjsLib = await loadPDFJS();
  console.log('✅ PDF.js chargé');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        
        console.log('📖 Ouverture PDF...');
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        console.log(`📄 PDF: ${pdf.numPages} page(s)`);
        
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
          
          console.log(`✅ Page ${i}/${pdf.numPages}`);
        }
        
        console.log('✅ Extraction terminée');
        console.log('📝 Texte (300 chars):', fullText.substring(0, 300));
        
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
  console.log('🖼️ Prétraitement...');
  
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
        console.log('✅ Image optimisée');
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
          console.log(`📊 ${percent}%`);
          if (onProgress) onProgress(`OCR ${percent}%`, 0.2 + (m.progress * 0.5));
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

export const extractTextFromFile = async (file, onProgress) => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 EXTRACTION');
  console.log('📄', file.name);
  console.log('📊', file.type);
  console.log('═══════════════════════════════════════');
  
  try {
    if (file.type === 'application/pdf') {
      console.log('🎯 PDF');
      if (onProgress) onProgress('Extraction PDF...', 0.1);
      return await extractPDFText(file);
    } else {
      console.log('🎯 Image');
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
// PARSING
// =====================================================

export const parseIngredientsFromText = (text) => {
  console.log('═══════════════════════════════════════');
  console.log('🔍 PARSING');
  console.log('═══════════════════════════════════════');
  
  // CORRECTION : Le PDF met tout sur une ligne
  // On doit splitter différemment
  
  // Remplacer les patterns d'ingrédients par des retours à la ligne
  // Pattern : "Nom kg/L/etc Prix €"
  text = text.replace(/€\s+([A-ZÀ-Ÿ])/g, '€\n$1');
  
  const ingredients = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  
  console.log(`📋 ${lines.length} lignes`);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (i < 20) console.log(`${i}: "${line}"`);
    
    if (line.match(/^(produit|unité|prix unitaire)/i)) {
      console.log('  ⏭️ En-tête');
      continue;
    }
    
    const parsed = parseLine(line);
    if (parsed) {
      ingredients.push(parsed);
      console.log(`  ✅ ${parsed.nom} ${parsed.prix}€/${parsed.unite}`);
    }
  }
  
  console.log(`🎯 ${ingredients.length} ingrédients`);
  return ingredients;
};

const parseLine = (line) => {
  line = line.replace(/\s+/g, ' ').trim();
  
  // Ignorer ligne "Total TTC"
  if (line.match(/^total\s+ttc/i)) {
    return null;
  }
  
  // Si la ligne contient un en-tête MAIS AUSSI un produit valide,
  // extraire juste la partie produit
  // Ex: "METRO ... Huile d'olive 3 L 12,50 € 37,50 €"
  if (line.match(/metro|cash|carry|facture|client|restaurant|date|avenue/i)) {
    // Chercher le pattern produit dans la ligne
    const productMatch = line.match(/([A-ZÀ-Ÿ][a-zà-ÿ\s']+(?:\d+%)?)\s+([\d]+(?:[,\.]\d+)?)\s*(kg|l|g|ml|cl|pièce|piece|unité|unite|botte|douzaine)\s+([\d]+[,\.][\d]{1,2})\s*€/i);
    if (productMatch) {
      // Reconstruire une ligne propre
      const [, nom, qte, unite, prix] = productMatch;
      line = `${nom} ${qte} ${unite} ${prix} €`;
    } else {
      return null;
    }
  }
  
  // Ignorer les lignes trop courtes ou sans chiffres
  if (line.length < 5 || !line.match(/\d/)) {
    return null;
  }
  
  // PATTERN 1 : Avec quantité ET total (facture complète)
  // "Tomate 5 kg 1,20 € 6,00 €" → ignore le total à la fin
  const withTotal = line.match(/^(.+?)\s+([\d]+(?:[,\.]\d+)?)\s*(kg|l|g|ml|cl|pièce|piece|unité|unite|botte|douzaine)\s+([\d]+[,\.][\d]{1,2})\s*€?\s+[\d,\.]+\s*€?\s*$/i);
  
  if (withTotal) {
    const [, nom, qte, unite, prix] = withTotal;
    const p = parseFloat(prix.replace(',', '.'));
    const q = parseFloat(qte.replace(',', '.'));
    
    if (p > 0 && p < 1000 && nom.length >= 2) {
      return {
        nom: nom.trim(),
        prix: p,
        unite: normalizeUnit(unite),
        quantite: q
      };
    }
  }
  
  // PATTERN 2 : Avec quantité SANS total
  // "Tomate 5 kg 1,20 €"
  const withQty = line.match(/^(.+?)\s+([\d]+(?:[,\.]\d+)?)\s*(kg|l|g|ml|cl|pièce|piece|unité|unite|botte|douzaine)\s+([\d]+[,\.][\d]{1,2})\s*€?\s*$/i);
  
  if (withQty) {
    const [, nom, qte, unite, prix] = withQty;
    const p = parseFloat(prix.replace(',', '.'));
    const q = parseFloat(qte.replace(',', '.'));
    
    if (p > 0 && p < 1000 && nom.length >= 2) {
      return {
        nom: nom.trim(),
        prix: p,
        unite: normalizeUnit(unite),
        quantite: q
      };
    }
  }
  
  // PATTERN 3 : Sans quantité (mercuriale simple)
  // "Farine T55 kg 0,85 €"
  const noQty = line.match(/^(.+?)\s+(kg|l|g|ml|cl|pièce|piece|unité|unite|botte|douzaine)\s+([\d]+[,\.][\d]{1,2})\s*€?\s*$/i);
  
  if (noQty) {
    const [, nom, unite, prix] = noQty;
    const p = parseFloat(prix.replace(',', '.'));
    
    if (p > 0 && p < 1000 && nom.length >= 2) {
      return {
        nom: nom.trim(),
        prix: p,
        unite: normalizeUnit(unite),
        quantite: 0
      };
    }
  }
  
  return null;
};

const normalizeUnit = (u) => {
  const map = { 'l': 'L', 'piece': 'pièce', 'unite': 'unité' };
  return map[u.toLowerCase()] || u;
};

// =====================================================
// ALLERGÈNES
// =====================================================

export const detectAllergenes = (nom) => {
  const n = nom.toLowerCase();
  const a = [];
  
  if (n.includes('farine') || n.includes('pâte')) a.push('Gluten');
  if (n.includes('lait') || n.includes('crème') || n.includes('fromage')) a.push('Lait');
  if (n.includes('œuf') || n.includes('oeuf')) a.push('Œufs');
  if (n.includes('poisson') || n.includes('saumon')) a.push('Poissons');
  if (n.includes('crevette')) a.push('Crustacés');
  
  return a;
};

// =====================================================
// IMPORT
// =====================================================

export const importMercuriale = async (file, onProgress) => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 IMPORT');
  console.log('═══════════════════════════════════════');
  
  try {
    const text = await extractTextFromFile(file, onProgress);
    
    if (!text || text.length < 20) {
      throw new Error('Fichier vide');
    }
    
    if (onProgress) onProgress('Parsing...', 0.7);
    const ingredients = parseIngredientsFromText(text);
    
    if (ingredients.length === 0) {
      throw new Error('Aucun ingrédient détecté');
    }
    
    if (onProgress) onProgress('Allergènes...', 0.9);
    const result = ingredients.map(ing => {
      const withAllergenes = {
        ...ing,
        allergenes: detectAllergenes(ing.nom)
      };
      
      // LOG pour vérifier la quantité
      console.log(`📦 ${ing.nom}: quantité=${ing.quantite}, prix=${ing.prix}`);
      
      return withAllergenes;
    });
    
    if (onProgress) onProgress('Terminé', 1.0);
    
    console.log(`✅ ${result.length} ingrédients`);
    console.log('📦 Résultat final:', result);
    return result;
    
  } catch (error) {
    console.error('❌', error);
    throw error;
  }
};

export const validateIngredients = (ingredients) => {
  return ingredients.filter(i => 
    i.nom && i.nom.length >= 2 && 
    i.prix && i.prix > 0 && 
    i.unite
  );
};

export const detectDuplicates = (existing, newItems) => {
  const duplicates = [];
  const toAdd = [];
  
  for (const item of newItems) {
    const dup = existing.find(e => e.nom.toLowerCase() === item.nom.toLowerCase());
    
    if (dup) {
      duplicates.push({
        existing: dup,
        new: item,
        priceDiff: item.prix - dup.prix,
        percentChange: (((item.prix - dup.prix) / dup.prix) * 100).toFixed(1)
      });
    } else {
      toAdd.push(item);
    }
  }
  
  return { duplicates, toAdd };
};