const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      userId: true,
      establishmentId: true,
      createdAt: true,
      revokedAt: true,
      expiresAt: true,
    },
  });
  console.table(sessions);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
