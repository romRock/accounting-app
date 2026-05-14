const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function checkLedgerSchema() {
  try {
    console.log('🔍 Checking ledger_entries table schema...\n');

    // Get all columns in ledger_entries table
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ledger_entries'
      ORDER BY ordinal_position
    `;

    console.log('--- ledger_entries columns ---');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if accountEntryId column exists
    const hasAccountEntryId = columns.some(col => col.column_name === 'accountEntryId');
    console.log(`\n✅ accountEntryId column exists: ${hasAccountEntryId}`);

    // Check constraints
    const constraints = await prisma.$queryRaw`
      SELECT conname, contype
      FROM pg_constraint
      WHERE conrelid = 'ledger_entries'::regclass
    `;

    console.log('\n--- ledger_entries constraints ---');
    constraints.forEach(con => {
      console.log(`  ${con.conname}: ${con.contype}`);
    });

    // Try a simple query to see if it works
    console.log('\n--- Testing ledgerEntry query ---');
    try {
      const result = await prisma.$queryRaw`SELECT * FROM "ledger_entries" LIMIT 1`;
      console.log(`✅ Query successful, found ${result.length} records`);
    } catch (error) {
      console.log(`❌ Query failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error checking ledger schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkLedgerSchema()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
