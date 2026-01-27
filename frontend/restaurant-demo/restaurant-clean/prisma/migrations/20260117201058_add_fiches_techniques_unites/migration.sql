-- CreateEnum
CREATE TYPE "MouvementType" AS ENUM ('ENTREE', 'SORTIE', 'AJUSTEMENT', 'TRANSFERT');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "densite" DOUBLE PRECISION,
ADD COLUMN     "prixParDefaut" DOUBLE PRECISION,
ADD COLUMN     "uniteParDefaut" TEXT;

-- CreateTable
CREATE TABLE "Prix" (
    "id" SERIAL NOT NULL,
    "produitId" INTEGER NOT NULL,
    "etablissementId" INTEGER,
    "montant" DOUBLE PRECISION NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'EUR',
    "valableDepuis" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valableJusqua" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FicheTechnique" (
    "id" SERIAL NOT NULL,
    "produitId" INTEGER NOT NULL,
    "rendement" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "uniteRdt" TEXT NOT NULL DEFAULT 'unit',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FicheTechnique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FicheIngredient" (
    "id" SERIAL NOT NULL,
    "ficheId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "unite" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "FicheIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unite" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "facteur" DOUBLE PRECISION NOT NULL,
    "precision" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "produitId" INTEGER NOT NULL,
    "etablissementId" INTEGER,
    "quantite" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unite" TEXT NOT NULL,
    "lastCountAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementStock" (
    "id" SERIAL NOT NULL,
    "produitId" INTEGER NOT NULL,
    "etablissementId" INTEGER,
    "type" "MouvementType" NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "unite" TEXT NOT NULL,
    "raison" TEXT,
    "referenceId" INTEGER,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MouvementStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prix_produitId_idx" ON "Prix"("produitId");

-- CreateIndex
CREATE INDEX "Prix_etablissementId_idx" ON "Prix"("etablissementId");

-- CreateIndex
CREATE UNIQUE INDEX "FicheTechnique_produitId_key" ON "FicheTechnique"("produitId");

-- CreateIndex
CREATE UNIQUE INDEX "Unite_code_key" ON "Unite"("code");

-- CreateIndex
CREATE INDEX "Stock_produitId_idx" ON "Stock"("produitId");

-- CreateIndex
CREATE INDEX "Stock_etablissementId_idx" ON "Stock"("etablissementId");

-- AddForeignKey
ALTER TABLE "Prix" ADD CONSTRAINT "Prix_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prix" ADD CONSTRAINT "Prix_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheTechnique" ADD CONSTRAINT "FicheTechnique_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheIngredient" ADD CONSTRAINT "FicheIngredient_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "FicheTechnique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheIngredient" ADD CONSTRAINT "FicheIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
