// Compare local vs production database structures
const { PrismaClient } = require('@prisma/client');

const LOCAL_DB_URL = "postgresql://postgres:Romil@7151@localhost:5432/hawala_app";
const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function compareDatabases() {
  console.log('🔍 Comparing local vs production database structures...');
  
  try {
    // Check local database
    console.log('\n📊 LOCAL DATABASE:');
    const localPrisma = new PrismaClient({
      datasources: { db: { url: LOCAL_DB_URL } }
    });
    
    const localTables = await localPrisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name ILIKE '%ransaction%'
      ORDER BY table_name
    `;
    
    console.log('Local transaction tables:', localTables.map(t => t.table_name));
    
    if (localTables.length > 0) {
      const localTable = localTables[0].table_name;
      console.log(`🔍 Local table: ${localTable}`);
      
      const localSchema = await localPrisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${localTable}'
        ORDER BY ordinal_position
      `;
      
      console.log('Local table columns:');
      localSchema.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }
    
    await localPrisma.$disconnect();
    
    // Check production database
    console.log('\n📊 PRODUCTION DATABASE:');
    const prodPrisma = new PrismaClient({
      datasources: { db: { url: PRODUCTION_DB_URL } }
    });
    
    const prodTables = await prodPrisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name ILIKE '%ransaction%'
      ORDER BY table_name
    `;
    
    console.log('Production transaction tables:', prodTables.map(t => t.table_name));
    
    if (prodTables.length > 0) {
      const prodTable = prodTables[0].table_name;
      console.log(`🔍 Production table: ${prodTable}`);
      
      const prodSchema = await prodPrisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${prodTable}'
        ORDER BY ordinal_position
      `;
      
      console.log('Production table columns:');
      prodSchema.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }
    
    await prodPrisma.$disconnect();
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`Local tables: ${localTables.length}`);
    console.log(`Production tables: ${prodTables.length}`);
    
    const localTableNames = localTables.map(t => t.table_name);
    const prodTableNames = prodTables.map(t => t.table_name);
    
    console.log('\n🔍 ANALYSIS:');
    console.log('Local has Transaction (uppercase):', localTableNames.includes('Transaction'));
    console.log('Production has Transaction (uppercase):', prodTableNames.includes('Transaction'));
    console.log('Local has transactions (lowercase):', localTableNames.includes('transactions'));
    console.log('Production has transactions (lowercase):', prodTableNames.includes('transactions'));
    
  } catch (error) {
    console.error('❌ Error comparing databases:', error.message);
    process.exit(1);
  }
}

// Run comparison
compareDatabases();
