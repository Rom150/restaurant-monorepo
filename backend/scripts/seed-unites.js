const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const units = [
    { code: 'mg', type: 'mass', nom: 'milligramme', facteur: 0.001, precision: 3 },
    { code: 'g',  type: 'mass', nom: 'gramme',        facteur: 1,     precision: 3 },
    { code: 'kg', type: 'mass', nom: 'kilogramme',    facteur: 1000,  precision: 3 },
    { code: 'ml', type: 'volume',nom: 'millilitre',    facteur: 1,     precision: 3 },
    { code: 'L',  type: 'volume',nom: 'litre',         facteur: 1000,  precision: 3 },
    { code: 'unit',type: 'count',nom: 'unité',         facteur: 1,     precision: 0 },
    { code: 'pc', type: 'count',nom: 'pièce',         facteur: 1,     precision: 0 },
    { code: 'box',type: 'count',nom: 'boîte',         facteur: 1,     precision: 0 },
    { code: 'pkg',type: 'count',nom: 'paquet',        facteur: 1,     precision: 0 },
  ];

  for (const u of units) {
    await prisma.unite.upsert({
      where: { code: u.code },
      update: { type: u.type, nom: u.nom, facteur: u.facteur, precision: u.precision },
      create: { code: u.code, type: u.type, nom: u.nom, facteur: u.facteur, precision: u.precision },
    });
    console.log('upsert unite', u.code);
  }

  console.log('Seed unités terminé.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
