const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const estName = process.env.SEED_ESTABLISHMENT_NAME || 'Test Establishment';

  // find by name first (name is not unique in schema), create if missing
  let establishment = await prisma.establishment.findFirst({
    where: { name: estName },
  });

  if (!establishment) {
    establishment = await prisma.establishment.create({
      data: { name: estName },
    });
  }

  // find the user by email
  const email = process.env.SEED_USER_EMAIL || 'newuser@example.com';
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`User with email ${email} not found. Create the user first or change SEED_USER_EMAIL.`);
    process.exit(1);
  }

  // attach user to establishment
  await prisma.user.update({
    where: { id: user.id },
    data: { establishmentId: establishment.id },
  });

  console.log('Seed complete. Establishment id:', establishment.id, 'attached to user id:', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
