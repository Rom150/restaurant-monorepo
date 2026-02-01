import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export d'une fiche technique en PDF professionnel
 * @param {Object} fiche - La fiche technique à exporter
 * @param {Object} ratios - Les ratios calculés (coûts, marges)
 * @param {Array} allergenes - Liste des allergènes présents
 */
export const exportFicheToPDF = (fiche, ratios, allergenes) => {
  // Créer un nouveau document PDF (format A4)
  const doc = new jsPDF();
  
  // Configuration des couleurs
  const primaryColor = [249, 115, 22]; // Orange
  const secondaryColor = [239, 68, 68]; // Rouge
  const textColor = [51, 51, 51]; // Gris foncé
  const lightGray = [240, 240, 240];
  
  let yPosition = 20;

  // ========== EN-TÊTE ==========
  // Rectangle de fond orange
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Titre principal
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('FICHE TECHNIQUE', 105, 15, { align: 'center' });
  
  // Nom du plat
  doc.setFontSize(18);
  doc.text(fiche.nom.toUpperCase(), 105, 28, { align: 'center' });
  
  // Informations générales
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`${fiche.portions} portion(s) | Date: ${new Date().toLocaleDateString('fr-FR')}`, 105, 35, { align: 'center' });
  
  yPosition = 50;

  // ========== ALERTE ALLERGÈNES (si présents) ==========
  if (allergenes.length > 0) {
    doc.setFillColor(254, 243, 199); // Jaune clair
    doc.setDrawColor(251, 191, 36); // Jaune foncé
    doc.setLineWidth(0.5);
    doc.rect(15, yPosition, 180, 15, 'FD');
    
    doc.setTextColor(146, 64, 14); // Orange foncé
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('⚠ ALLERGÈNES PRÉSENTS:', 20, yPosition + 6);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(allergenes.join(', '), 20, yPosition + 11);
    
    yPosition += 22;
  }

  // ========== SECTION INGRÉDIENTS ==========
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('INGRÉDIENTS', 15, yPosition);
  
  yPosition += 8;

  // Tableau des ingrédients
  const ingredientsData = fiche.ingredients.map(ing => [
    ing.nom,
    `${ing.quantite} ${ing.unite}`,
    `${ing.prix.toFixed(2)} €`,
    `${(ing.prix * ing.quantite).toFixed(2)} €`
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [['Ingrédient', 'Quantité', 'Prix unitaire', 'Coût total']],
    body: ingredientsData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor
    },
    alternateRowStyles: {
      fillColor: lightGray
    },
    margin: { left: 15, right: 15 }
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // ========== SECTION CALCULS ==========
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('CALCUL DES COÛTS', 15, yPosition);
  
  yPosition += 8;

  // Tableau des calculs
  const calculData = [
    ['Coût total', `${ratios.coutTotal.toFixed(2)} €`],
    ['Coût par portion', `${ratios.coutParPortion.toFixed(2)} €`],
    ['Prix de vente conseillé (x3)', `${ratios.prixVenteConseille.toFixed(2)} €`],
    ['Ratio coût matière', `${ratios.ratio.toFixed(1)} %`]
  ];

  doc.autoTable({
    startY: yPosition,
    body: calculData,
    theme: 'plain',
    styles: {
      fontSize: 11,
      cellPadding: 5
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { fontStyle: 'bold', textColor: primaryColor, cellWidth: 50, halign: 'right' }
    },
    margin: { left: 15 }
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // Indicateur de qualité du ratio
  const ratioValue = ratios.ratio;
  let ratioText = '';
  let ratioColor = [0, 0, 0];

  if (ratioValue <= 30) {
    ratioText = '✓ Excellent ratio (≤30%)';
    ratioColor = [34, 197, 94]; // Vert
  } else if (ratioValue <= 35) {
    ratioText = '✓ Bon ratio (30-35%)';
    ratioColor = [34, 197, 94];
  } else if (ratioValue <= 40) {
    ratioText = '⚠ Ratio acceptable (35-40%)';
    ratioColor = [251, 191, 36]; // Orange
  } else {
    ratioText = '✗ Ratio élevé (>40%)';
    ratioColor = [239, 68, 68]; // Rouge
  }

  doc.setFillColor(...ratioColor);
  doc.rect(15, yPosition, 5, 5, 'F');
  doc.setTextColor(...ratioColor);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(ratioText, 22, yPosition + 4);

  yPosition += 15;

  // ========== INSTRUCTIONS DE PRÉPARATION ==========
  if (fiche.instructions && fiche.instructions.trim()) {
    // Vérifier s'il reste assez de place, sinon nouvelle page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('INSTRUCTIONS DE PRÉPARATION', 15, yPosition);
    
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Découper le texte pour qu'il tienne dans la largeur
    const splitInstructions = doc.splitTextToSize(fiche.instructions, 180);
    doc.text(splitInstructions, 15, yPosition);
    
    yPosition += splitInstructions.length * 5 + 10;
  }

  // ========== PIED DE PAGE ==========
  const pageCount = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, 280, 195, 280);
    
    // Texte du pied de page
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Gestion Restaurant Pro - Document généré automatiquement', 15, 285);
    doc.text(`Page ${i} / ${pageCount}`, 195, 285, { align: 'right' });
    doc.text(new Date().toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }), 105, 290, { align: 'center' });
  }

  // ========== SAUVEGARDE DU PDF ==========
  const fileName = `fiche_${fiche.nom.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};

/**
 * Export de plusieurs fiches en un seul PDF
 * @param {Array} fiches - Tableau de fiches techniques
 * @param {Function} calculateRatios - Fonction de calcul des ratios
 * @param {Function} getAllergenes - Fonction d'extraction des allergènes
 */
export const exportMultipleFichesToPDF = (fiches, calculateRatios, getAllergenes) => {
  const doc = new jsPDF();
  
  fiches.forEach((fiche, index) => {
    if (index > 0) {
      doc.addPage();
    }
    
    const ratios = calculateRatios(fiche);
    const allergenes = getAllergenes(fiche);
    
    // Réutiliser la fonction d'export mais sans sauvegarder
    // (Cette partie nécessiterait une refactorisation pour éviter la duplication)
  });
  
  const fileName = `fiches_multiples_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};

/**
 * Export de la mercuriale complète en PDF
 * @param {Array} ingredients - Liste des ingrédients
 */
export const exportMercurialeToPDF = (ingredients) => {
  const doc = new jsPDF();
  const primaryColor = [249, 115, 22];
  
  // En-tête
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('MERCURIALE', 105, 20, { align: 'center' });
  
  // Tableau des ingrédients
  const mercurialeData = ingredients.map(ing => [
    ing.nom,
    `${ing.prix.toFixed(2)} €`,
    ing.unite,
    ing.allergenes ? ing.allergenes.join(', ') : '-'
  ]);

  doc.autoTable({
    startY: 40,
    head: [['Ingrédient', 'Prix', 'Unité', 'Allergènes']],
    body: mercurialeData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }
  });
  
  const fileName = `mercuriale_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};