if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run seed in production (NODE_ENV=production). Set NODE_ENV=development to run.');
  process.exit(1);
}
// scripts/seed-fiches.js
// Usage: from backend/api run: node scripts/seed-fiches.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findOrCreateProduct(data) {
  // findFirst car name n'est pas unique dans ton schema
  const existing = await prisma.product.findFirst({ where: { name: data.name } });
  if (existing) {
    return await prisma.product.update({
      where: { id: existing.id },
      data,
    });
  } else {
    return await prisma.product.create({ data });
  }
}

async function main() {
  console.log('Seeding units...');
  const units = [
    { code: 'g',   nom: 'gramme',     type: 'mass',   facteur: 1,    precision: 0 },
    { code: 'kg',  nom: 'kilogramme', type: 'mass',   facteur: 1000, precision: 3 },
    { code: 'ml',  nom: 'millilitre', type: 'volume', facteur: 1,    precision: 0 },
    { code: 'l',   nom: 'litre',      type: 'volume', facteur: 1000, precision: 3 },
    { code: 'unit',nom: 'unité',      type: 'count',  facteur: 1,    precision: 0 },
  ];
  for (const u of units) {
    await prisma.unite.upsert({
      where: { code: u.code },
      update: u,
      create: u,
    });
  }
  console.log('Units upserted.');

  console.log('Seeding products...');
  // Produit ingrédient (tomate) — price est requis dans ton schema
  const ingrData = {
    name: 'Tomate (ingrédient)',
    description: 'Ingrédient de test',
    price: 0.5, // champ requis dans ton schema
    prixParDefaut: 2.5,
    uniteParDefaut: 'g',
    densite: 1.0,
  };
  const prodData = {
    name: 'Sauce Tomate (produit)',
    description: 'Produit fini de test',
    price: 0.0,
    prixParDefaut: 0,
    uniteParDefaut: 'unit',
  };

  const ingr = await findOrCreateProduct(ingrData);
  const prod = await findOrCreateProduct(prodData);
  console.log('Products upserted:', { ingrId: ingr.id, prodId: prod.id });

  console.log('Seeding price entry (prix table) for ingredient at etablissement 1...');
  try {
    await prisma.prix.create({
      data: {
        produitId: ingr.id,
        etablissementId: 1,
        montant: 0.0025,
        valableDepuis: new Date(),
      },
    });
    console.log('Prix created.');
  } catch (e) {
    console.warn('Could not create prix entry (maybe already exists):', e.message || e);
  }

  console.log('Creating or updating a fiche technique example...');
  const existingFiche = await prisma.ficheTechnique.findUnique({
    where: { produitId: prod.id },
  });

  if (existingFiche) {
    await prisma.ficheIngredient.deleteMany({ where: { ficheId: existingFiche.id } });
    const updated = await prisma.ficheTechnique.update({
      where: { produitId: prod.id },
      data: {
        rendement: 1,
        uniteRdt: 'unit',
        notes: 'Fiche seed: Sauce Tomate (mise à jour)',
        items: {
          create: [
            {
              ingredientId: ingr.id,
              quantite: 200,
              unite: 'g',
              ordre: 1,
              notes: 'Tomates fraîches',
            },
          ],
        },
      },
      include: { items: true },
    });
    console.log('Fiche updated with id:', updated.id);
  } else {
    const fiche = await prisma.ficheTechnique.create({
      data: {
        produitId: prod.id,
        rendement: 1,
        uniteRdt: 'unit',
        notes: 'Fiche seed: Sauce Tomate',
        items: {
          create: [
            {
              ingredientId: ingr.id,
              quantite: 200,
              unite: 'g',
              ordre: 1,
              notes: 'Tomates fraîches',
            },
          ],
        },
      },
      include: { items: true },
    });
    console.log('Fiche created with id:', fiche.id);
  }

  console.log('Seed complete. 🎉');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
