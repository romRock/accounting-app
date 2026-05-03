#!/bin/bash

# Safe build script that handles migrations without data loss
echo "🔧 Starting safe build process..."

# Step 1: Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Step 2: Check if we need to run the permissions migration
echo "🔍 Checking database state..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMigration() {
  try {
    // Try to query roles with permissions field
    await prisma.role.findFirst();
    console.log('✅ Database schema is compatible');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('permissions')) {
      console.log('⚠️ Need to run permissions migration');
      process.exit(1);
    } else {
      console.log('❌ Other database error:', error.message);
      process.exit(2);
    }
  } finally {
    await prisma.\$disconnect();
  }
}

checkMigration();
"

MIGRATION_STATUS=$?

if [ $MIGRATION_STATUS -eq 1 ]; then
  echo "🔄 Running permissions migration..."
  
  # Run the custom migration script
  node scripts/permissions-migration.js
  
  if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
  else
    echo "❌ Migration failed"
    exit 1
  fi
elif [ $MIGRATION_STATUS -eq 2 ]; then
  echo "❌ Database connection error"
  exit 1
fi

# Step 3: Build TypeScript
echo "🏗️ Building TypeScript..."
npx tsc

echo "🎉 Build completed successfully!"
