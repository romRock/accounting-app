const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Rebuilding production backend for accounting module...\n');

try {
  console.log('Step 1: Cleaning dist folder...');
  if (process.platform === 'win32') {
    execSync('if exist dist rmdir /s /q dist', { cwd: __dirname });
  } else {
    execSync('rm -rf dist', { cwd: __dirname });
  }
  console.log('✅ Dist folder cleaned');

  console.log('\nStep 2: Building TypeScript...');
  execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  console.log('✅ TypeScript build completed');

  console.log('\nStep 3: Regenerating Prisma client...');
  execSync('npx prisma generate', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  console.log('✅ Prisma client regenerated');

  console.log('\n✅ Production backend rebuild completed successfully');
  console.log('📝 Next steps:');
  console.log('   1. Commit and push changes to git');
  console.log('   2. Render will auto-deploy the updated backend');
  console.log('   3. Test accounting APIs after deployment');
} catch (error) {
  console.error('❌ Error during rebuild:', error.message);
  process.exit(1);
}
