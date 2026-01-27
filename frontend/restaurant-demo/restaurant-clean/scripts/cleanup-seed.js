// scripts/cleanup-seed.js
// Usage: from backend/api run: npm run seed:clean
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run cleanup in production (NODE_ENV=production).');
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prod = await prisma.product.findFirst({ where: { name: 'Sauce Tomate (produit)' }});
  if (prod) {
    const fiche = await prisma.ficheTechnique.findUnique({ where: { produitId: prod.id }});
    if (fiche) {
      await prisma.ficheIngredient.deleteMany({ where: { ficheId: fiche.id }});
      await prisma.ficheTechnique.delete({ where: { id: fiche.id }});
      console.log('FicheTechnique and items deleted:', fiche.id);
    }
    await prisma.product.delete({ where: { id: prod.id }});
    console.log('Product deleted:', prod.id);
  } else {
    console.log('Produit "Sauce Tomate (produit)" non trouvé.');
  }

  const ingr = await prisma.product.findFirst({ where: { name: 'Tomate (ingrédient)' }});
  if (ingr) {
    await prisma.prix.deleteMany({ where: { produitId: ingr.id }});
    await prisma.product.delete({ where: { id: ingr.id }});
    console.log('Ingredient and prix deleted:', ingr.id);
  } else {
    console.log('Produit "Tomate (ingrédient)" non trouvé.');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
