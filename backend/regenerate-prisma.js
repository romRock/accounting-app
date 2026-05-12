const { execSync } = require('child_process');

console.log('🔄 Regenerating Prisma client...');

try {
  // Generate Prisma client
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Prisma client regenerated successfully');
} catch (error) {
  console.error('❌ Error regenerating Prisma client:', error);
  process.exit(1);
}
