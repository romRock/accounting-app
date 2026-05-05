// Fix production database with simple approach
console.log('🔧 Fixing production database structure...');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

// Use psql command with full connection string
const { execSync } = require('child_process');

try {
  console.log('🗑️ Removing duplicate transactions table...');
  
  // Remove duplicate transactions table
  const dropResult = execSync(`psql "${PRODUCTION_DB_URL}" -c "DROP TABLE IF EXISTS transactions CASCADE;"`, {
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('📊 Drop result:', dropResult.stdout);
  console.log('📊 Drop error:', dropResult.stderr);
  
  if (dropResult.status === 0) {
    console.log('✅ Successfully removed duplicate transactions table');
    
    // Verify the fix
    console.log('🔍 Verifying database structure...');
    const verifyResult = execSync(`psql "${PRODUCTION_DB_URL}" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%ransaction%';"`, {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    console.log('📊 Verification result:', verifyResult.stdout);
    
    if (verifyResult.stdout.includes('transactions')) {
      console.log('❌ Duplicate table still exists');
    } else if (verifyResult.stdout.includes('Transaction')) {
      console.log('⚠️ Unexpected: Transaction table exists (should be transactions)');
    } else {
      console.log('✅ Production database cleaned successfully!');
    }
    
  } else {
    console.error('❌ Failed to remove duplicate table');
  }
  
} catch (error) {
  console.error('❌ Script error:', error.message);
  process.exit(1);
}
