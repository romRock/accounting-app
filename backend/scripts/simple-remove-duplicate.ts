// Simple script to remove duplicate transactions table
const { execSync } = require('child_process');

console.log('🗑️ Removing duplicate transactions table from production database...');

try {
  console.log('🔧 Using direct SQL to remove duplicate table...');
  
  // Use direct SQL command to avoid Prisma permission issues
  const result = execSync(`psql "${process.env.PRODUCTION_DB_URL}" -c "DROP TABLE IF EXISTS transactions CASCADE;"`, {
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('📊 SQL command result:', result);
  
  if (result.error) {
    console.error('❌ Error removing duplicate table:', result.error);
    process.exit(1);
  } else {
    console.log('✅ Successfully removed duplicate transactions table');
  }
  
} catch (error) {
  console.error('❌ Script error:', error.message);
  process.exit(1);
}
