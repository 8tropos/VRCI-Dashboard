import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

const WHITELISTED_ADDRESSES = [
  '5Dc2AZgBtFERxPqVxhxMfmeKQt8BMfxSeMyxQCyCxqy35e1a',
  '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
];

async function main() {
  console.log('🌱 Starting database seed...');

  for (const address of WHITELISTED_ADDRESSES) {
    const existing = await prisma.whitelist.findUnique({
      where: { address },
    });

    if (existing) {
      console.log(`✅ Wallet ${address} is already whitelisted`);
    } else {
      await prisma.whitelist.create({
        data: {
          address,
          note: 'Initial whitelisted wallet (seed script)',
        },
      });
      console.log(`✅ Added whitelisted wallet: ${address}`);
    }
  }

  console.log('✨ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
