const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function fixLedgerAccountEntryId() {
  try {
    console.log('🔧 Fixing ledger_entries.accountEntryId column...\n');

    // Check if column exists
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ledger_entries'
        AND column_name = 'accountEntryId'
    `;

    if (columnCheck.length > 0) {
      console.log('✅ accountEntryId column already exists in ledger_entries');
      return;
    }

    console.log('🛠️ Adding accountEntryId column to ledger_entries...');
    
    // Add the column
    await prisma.$executeRaw`ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "accountEntryId" TEXT;`;
    console.log('✅ Column added successfully');

    // Create index
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ledger_entries_accountEntryId_idx" ON "ledger_entries"("accountEntryId");`;
    console.log('✅ Index created successfully');

    // Add foreign key constraint
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_accountEntryId_fkey'
        ) THEN
          ALTER TABLE "ledger_entries"
            ADD CONSTRAINT "ledger_entries_accountEntryId_fkey"
            FOREIGN KEY ("accountEntryId") REFERENCES "account_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END;
      $$;
    `;
    console.log('✅ Foreign key constraint added successfully');

    console.log('\n✅ ledger_entries.accountEntryId column fix completed');
  } catch (error) {
    console.error('❌ Error fixing ledger_entries table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixLedgerAccountEntryId()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
