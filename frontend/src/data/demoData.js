// Données de démonstration - À copier dans src/data/demoData.js

export const demoIngredients = [
  {id:1,nom:"Tomates",prix:3.50,unite:"kg",stockActuel:8,stockMin:10,stockCritique:5,stockMax:25,allergenes:[],mouvements:[]},
  {id:2,nom:"Courgettes",prix:2.80,unite:"kg",stockActuel:12,stockMin:8,stockCritique:3,stockMax:20,allergenes:[],mouvements:[]},
  {id:3,nom:"Aubergines",prix:4.20,unite:"kg",stockActuel:6,stockMin:5,stockCritique:2,stockMax:15,allergenes:[],mouvements:[]},
  {id:4,nom:"Poivrons rouges",prix:5.00,unite:"kg",stockActuel:7,stockMin:6,stockCritique:2,stockMax:15,allergenes:[],mouvements:[]},
  {id:5,nom:"Oignons",prix:1.50,unite:"kg",stockActuel:15,stockMin:10,stockCritique:5,stockMax:30,allergenes:[],mouvements:[]},
  {id:6,nom:"Ail",prix:8.00,unite:"kg",stockActuel:2,stockMin:1,stockCritique:0.5,stockMax:3,allergenes:[],mouvements:[]},
  {id:7,nom:"Huile d'olive",prix:12.00,unite:"L",stockActuel:3,stockMin:2,stockCritique:1,stockMax:8,allergenes:[],mouvements:[]},
  {id:8,nom:"Thym",prix:15.00,unite:"kg",stockActuel:0.3,stockMin:0.2,stockCritique:0.1,stockMax:0.5,allergenes:[],mouvements:[]},
  {id:9,nom:"Sel",prix:2.00,unite:"kg",stockActuel:5,stockMin:3,stockCritique:1,stockMax:10,allergenes:[],mouvements:[]},
  {id:10,nom:"Poivre",prix:25.00,unite:"kg",stockActuel:0.8,stockMin:0.5,stockCritique:0.2,stockMax:1.5,allergenes:[],mouvements:[]},
  {id:11,nom:"Poulet fermier",prix:8.50,unite:"kg",stockActuel:18,stockMin:15,stockCritique:8,stockMax:30,allergenes:[],mouvements:[]},
  {id:12,nom:"Beurre doux",prix:7.00,unite:"kg",stockActuel:4,stockMin:3,stockCritique:1,stockMax:8,allergenes:["Lait"],mouvements:[]},
  {id:13,nom:"Pommes de terre",prix:1.80,unite:"kg",stockActuel:25,stockMin:20,stockCritique:10,stockMax:50,allergenes:[],mouvements:[]},
  {id:14,nom:"Carottes",prix:1.20,unite:"kg",stockActuel:12,stockMin:10,stockCritique:5,stockMax:25,allergenes:[],mouvements:[]},
  {id:15,nom:"Champignons",prix:6.50,unite:"kg",stockActuel:3,stockMin:5,stockCritique:2,stockMax:12,allergenes:[],mouvements:[]},
  {id:16,nom:"Crème fraîche",prix:4.50,unite:"L",stockActuel:2,stockMin:3,stockCritique:1,stockMax:8,allergenes:["Lait"],mouvements:[]},
  {id:17,nom:"Vin blanc",prix:8.00,unite:"L",stockActuel:1.5,stockMin:2,stockCritique:0.5,stockMax:6,allergenes:["Sulfites"],mouvements:[]},
  {id:18,nom:"Farine",prix:1.50,unite:"kg",stockActuel:8,stockMin:10,stockCritique:5,stockMax:25,allergenes:["Gluten"],mouvements:[]},
  {id:19,nom:"Sucre",prix:1.20,unite:"kg",stockActuel:12,stockMin:8,stockCritique:3,stockMax:20,allergenes:[],mouvements:[]},
  {id:20,nom:"Oeufs",prix:0.35,unite:"unité",stockActuel:48,stockMin:60,stockCritique:30,stockMax:120,allergenes:["Œufs"],mouvements:[]},
  {id:21,nom:"Pommes Golden",prix:2.80,unite:"kg",stockActuel:15,stockMin:10,stockCritique:5,stockMax:25,allergenes:[],mouvements:[]},
  {id:22,nom:"Levure chimique",prix:12.00,unite:"kg",stockActuel:0.4,stockMin:0.3,stockCritique:0.1,stockMax:1,allergenes:[],mouvements:[]}
];

export const demoFiches = [
  {
    id:1,
    nom:"Ratatouille Provençale",
    portions:4,
    ingredients:[
      {id:1,nom:"Tomates",quantite:0.5,unite:"kg",prix:3.50},
      {id:2,nom:"Courgettes",quantite:0.3,unite:"kg",prix:2.80},
      {id:3,nom:"Aubergines",quantite:0.3,unite:"kg",prix:4.20},
      {id:4,nom:"Poivrons rouges",quantite:0.2,unite:"kg",prix:5.00},
      {id:5,nom:"Oignons",quantite:0.1,unite:"kg",prix:1.50},
      {id:6,nom:"Ail",quantite:0.02,unite:"kg",prix:8.00},
      {id:7,nom:"Huile d'olive",quantite:0.05,unite:"L",prix:12.00},
      {id:8,nom:"Thym",quantite:0.005,unite:"kg",prix:15.00},
      {id:9,nom:"Sel",quantite:0.01,unite:"kg",prix:2.00},
      {id:10,nom:"Poivre",quantite:0.002,unite:"kg",prix:25.00}
    ],
    instructions:"1. Laver et couper tous les légumes en dés\n2. Faire revenir l'oignon et l'ail\n3. Ajouter les légumes progressivement\n4. Mijoter 30 minutes",
    prixVente:12.50
  },
  {
    id:2,
    nom:"Gratin Dauphinois",
    portions:6,
    ingredients:[
      {id:13,nom:"Pommes de terre",quantite:1.5,unite:"kg",prix:1.80},
      {id:16,nom:"Crème fraîche",quantite:0.5,unite:"L",prix:4.50},
      {id:6,nom:"Ail",quantite:0.02,unite:"kg",prix:8.00},
      {id:12,nom:"Beurre doux",quantite:0.03,unite:"kg",prix:7.00},
      {id:9,nom:"Sel",quantite:0.01,unite:"kg",prix:2.00},
      {id:10,nom:"Poivre",quantite:0.005,unite:"kg",prix:25.00}
    ],
    instructions:"1. Émincer les pommes de terre\n2. Disposer en couches avec la crème\n3. Cuire 1h à 180°C",
    prixVente:9.50
  }
];