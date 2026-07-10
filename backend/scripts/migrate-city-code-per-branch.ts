/**
 * One-time migration: city code unique per branch (not globally).
 * Run: npx tsx scripts/migrate-city-code-per-branch.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating cities.code unique constraint to (code, branchId)...');

  // Old schema used a UNIQUE INDEX (not a table constraint) on code alone
  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS cities_code_key;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE cities DROP CONSTRAINT IF EXISTS cities_code_key;`);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS cities_code_branchId_key
    ON cities (code, "branchId");
  `);

  const indexes = await prisma.$queryRawUnsafe<
    { indexname: string }[]
  >(`SELECT indexname FROM pg_indexes WHERE tablename = 'cities' ORDER BY indexname`);
  console.log('Cities indexes now:', indexes.map((i) => i.indexname));
  console.log('Done. City codes are now unique per branch.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
