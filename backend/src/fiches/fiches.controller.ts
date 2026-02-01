import { Controller, Post, Get, Body, Param, Put, Delete } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('api/fiches')
export class FichesController {
  @Post()
  async create(@Body() payload: any) {
    const { titre, produitId, rendement, uniteRdt, notes, photoUrl, items = [] } = payload || {};
    let productId = produitId || null;
    if (!productId && titre) {
      const prod = await prisma.product.create({ data: { name: titre, price: 0 } });
      productId = prod.id;
    }

    const fiche = await prisma.ficheTechnique.create({
      data: {
        produitId: productId,
        rendement: rendement || 1,
        uniteRdt: uniteRdt || 'unit',
        notes: notes || null,
      },
    });

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it || !it.name) continue;
      const name = (it.name || '').trim();
      let ingr: any = null;
      if (name.length > 0) {
        ingr = await prisma.product.findFirst({
          where: {
            name: { equals: name, mode: 'insensitive' },
          },
        });
      }
      if (!ingr) {
        ingr = await prisma.product.create({
          data: {
            name,
            price: it.prix ? Number(it.prix) : 0,
          },
        });
      }
      await prisma.ficheIngredient.create({
        data: {
          ficheId: fiche.id,
          ingredientId: ingr!.id,
          quantite: Number(it.quantite || 0),
          unite: it.unite || 'unit',
          ordre: i,
        },
      });
    }

    if (photoUrl) {
      await prisma.ficheTechnique.update({
        where: { id: fiche.id },
        data: { notes: (notes ? notes + '\n' : '') + `photo:${photoUrl}` },
      });
    }

    return { success: true, ficheId: fiche.id };
  }

  @Get()
  async list() {
    const fiches = await prisma.ficheTechnique.findMany({
      include: { items: { include: { ingredient: true } }, produit: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: fiches };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const fiche = await prisma.ficheTechnique.findUnique({
      where: { id: Number(id) },
      include: { items: { include: { ingredient: true } }, produit: true },
    });
    return { data: fiche };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: any) {
    const { notes, rendement, uniteRdt, items } = payload || {};
    await prisma.ficheIngredient.deleteMany({ where: { ficheId: Number(id) } });
    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it || !it.name) continue;
        let ingr = await prisma.product.findFirst({
          where: { name: { equals: (it.name || '').trim(), mode: 'insensitive' } },
        });
        if (!ingr) {
          ingr = await prisma.product.create({
            data: {
              name: it.name,
              price: it.prix ? Number(it.prix) : 0,
            },
          });
        }
        await prisma.ficheIngredient.create({
          data: {
            ficheId: Number(id),
            ingredientId: ingr!.id,
            quantite: Number(it.quantite || 0),
            unite: it.unite || 'unit',
            ordre: i,
          },
        });
      }
    }
    const updated = await prisma.ficheTechnique.update({
      where: { id: Number(id) },
      data: { notes: notes || undefined, rendement: rendement || undefined, uniteRdt: uniteRdt || undefined },
    });
    return { success: true, data: updated };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await prisma.ficheIngredient.deleteMany({ where: { ficheId: Number(id) } });
    await prisma.ficheTechnique.delete({ where: { id: Number(id) } });
    return { success: true };
  }
}