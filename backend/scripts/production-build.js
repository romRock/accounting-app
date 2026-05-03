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
    
    if (isProduction) {
      console.log('🚀 Production environment detected - running full build...');
      
      // In production, run the full build process
      console.log('📦 Generating Prisma client...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      
      console.log('🔄 Running permissions migration...');
      execSync('node scripts/permissions-migration.js', { stdio: 'inherit' });
      
      console.log('🔧 Updating admin role permissions...');
      execSync('npx tsx scripts/update-admin-role-production.ts', { stdio: 'inherit' });
      
      console.log('🏗️ Building TypeScript...');
      execSync('npx tsc', { stdio: 'inherit' });
      
    } else {
      console.log('🔧 Local development environment detected - running safe build...');
      
      // In local development, skip the problematic Prisma generate step
      // but still run the migration and TypeScript compilation
      
      console.log('🔄 Running permissions migration...');
      execSync('node scripts/permissions-migration.js', { stdio: 'inherit' });
      
      console.log('🏗️ Building TypeScript...');
      execSync('npx tsc', { stdio: 'inherit' });
      
      console.log('ℹ️ Note: Prisma client generation skipped due to local permission issue');
      console.log('ℹ️ This will work correctly in production environment');
    }
    
    console.log('✅ Build completed successfully!');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run the build
productionBuild();
