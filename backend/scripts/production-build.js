#!/usr/bin/env node

// Production-safe build script
// This script handles the local Prisma permission issue while ensuring production builds work

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting production-safe build process...');

async function productionBuild() {
  try {
    // Step 1: Check if we're in production environment
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    
    console.log('🔄 Running permissions migration...');
    execSync('node scripts/permissions-migration.js', { stdio: 'inherit' });

    if (isProduction) {
      console.log('🚀 Production environment detected - running production setup...');

      console.log('📦 Generating Prisma client...');
      execSync('npx prisma generate', { stdio: 'inherit' });

      console.log('Creating SpecialEntry table...');
      execSync('node scripts/create-special-entry-table.js', { stdio: 'inherit' });

      console.log('Updating admin role permissions...');
      execSync('npx tsx scripts/update-admin-role-production.ts', { stdio: 'inherit' });
    } else {
      console.log('🔧 Local build - skipping Prisma generate (dev uses tsx/nodemon directly)');
    }

    // Always compile TypeScript so dist/ matches current source.
    // Local dev (npm run dev:prisma) runs src/ directly and is unaffected.
    console.log('🏗️ Building TypeScript...');
    execSync('npx tsc', { stdio: 'inherit' });
    
    console.log('✅ Build completed successfully!');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run the build
productionBuild();
