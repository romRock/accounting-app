// Remove duplicate transaction table from production database
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function removeDuplicateTransactionTable() {
  console.log('🗑️ Removing duplicate transaction table from production database...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Step 1: Check current transaction tables
    console.log('🔍 Checking current transaction tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name ILIKE '%ransaction%'
      ORDER BY table_name
    `;
    
    console.log('📊 Current transaction tables:', tables.map(t => t.table_name));
    
    const transactionTables = tables.filter(t => 
      t.table_name.toLowerCase().includes('transaction')
    );
    
    console.log(`📊 Found ${transactionTables.length} transaction-related tables`);
    
    if (transactionTables.length > 1) {
      console.log('⚠️ Multiple transaction tables found - need to identify which to keep');
      
      // Step 2: Check data in each table
      for (const table of transactionTables) {
        console.log(`\n🔍 Checking data in table: ${table.table_name}`);
        
        try {
          const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "${table.table_name}"`;
          console.log(`📊 Records in ${table.table_name}:`, count[0].count);
          
          if (count[0].count > 0) {
            const sample = await prisma.$queryRaw`SELECT * FROM "${table.table_name}" LIMIT 2`;
            console.log('📊 Sample records:');
            sample.forEach((record, index) => {
              console.log(`  Record ${index + 1}:`, {
                id: record.id,
                transactionId: record.transactionid || record.transactionId,
                date: record.date,
                type: record.type,
                amount: record.amount
              });
            });
          }
          
        } catch (tableError) {
          console.error(`❌ Error checking table ${table.table_name}:`, tableError.message);
        }
      }
      
      // Step 3: Identify which table to keep (with most recent data)
      let tableToKeep = transactionTables[0].table_name;
      let maxRecords = 0;
      
      for (const table of transactionTables) {
        try {
          const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "${table.table_name}"`;
          if (count[0].count > maxRecords) {
            maxRecords = count[0].count;
            tableToKeep = table.table_name;
          }
        } catch (countError) {
          console.error(`❌ Error counting records in ${table.table_name}:`, countError.message);
        }
      }
      
      console.log(`\n✅ Keeping table with most records: ${tableToKeep} (${maxRecords} records)`);
      
      // Step 4: Drop other transaction tables
      for (const table of transactionTables) {
        if (table.table_name !== tableToKeep) {
          console.log(`\n🗑️ Dropping table: ${table.table_name}`);
          
          try {
            await prisma.$executeRaw`DROP TABLE "${table.table_name}" CASCADE`;
            console.log(`✅ Dropped table: ${table.table_name}`);
          } catch (dropError) {
            console.error(`❌ Error dropping table ${table.table_name}:`, dropError.message);
          }
        }
      }
      
      // Step 5: Verify final state
      console.log('\n🔍 Verifying final state...');
      const finalTables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name ILIKE '%ransaction%'
        ORDER BY table_name
      `;
      
      console.log('📊 Final transaction tables:', finalTables.map(t => t.table_name));
      
      const finalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "${tableToKeep}"`;
      console.log(`📊 Records in kept table:`, finalCount[0].count);
      
    } else if (transactionTables.length === 1) {
      console.log('✅ Only one transaction table found - no duplicates to remove');
    } else {
      console.log('⚠️ No transaction tables found');
    }
    
    await prisma.$disconnect();
    console.log('🎉 Duplicate transaction table cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error removing duplicate transaction table:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
removeDuplicateTransactionTable();
