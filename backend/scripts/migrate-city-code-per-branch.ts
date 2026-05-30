/**
 * One-time migration: city code unique per branch (not globally).
 * Run: npx tsx scripts/migrate-city-code-per-branch.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating cities.code unique constraint to (code, branchId)...');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE cities DROP CONSTRAINT IF EXISTS cities_code_key;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS cities_code_branchId_key
    ON cities (code, "branchId");
  `);

  console.log('Done. City codes are now unique per branch.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
