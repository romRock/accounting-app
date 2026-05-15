// Add missing deletedAt columns to production database
// This script fixes the schema mismatch in production
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function addDeletedAtColumns() {
  console.log('🔧 Adding missing deletedAt columns to production database...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Check and add deletedAt to Hawala table
    console.log('🔍 Checking Hawala table for deletedAt column...');
    const hawalaSchema = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Hawala'
      AND column_name = 'deletedAt'
    `;
    
    if (hawalaSchema.length === 0) {
      console.log('➕ Adding deletedAt column to Hawala table...');
      await prisma.$executeRaw`ALTER TABLE "Hawala" ADD COLUMN "deletedAt" TIMESTAMP`;
      console.log('✅ Added deletedAt to Hawala');
    } else {
      console.log('✅ Hawala already has deletedAt column');
    }
    
    // Check and add deletedBy to Hawala table
    console.log('🔍 Checking Hawala table for deletedBy column...');
    const hawalaDeletedBy = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Hawala'
      AND column_name = 'deletedBy'
    `;
    
    if (hawalaDeletedBy.length === 0) {
      console.log('➕ Adding deletedBy column to Hawala table...');
      await prisma.$executeRaw`ALTER TABLE "Hawala" ADD COLUMN "deletedBy" TEXT`;
      console.log('✅ Added deletedBy to Hawala');
    } else {
      console.log('✅ Hawala already has deletedBy column');
    }
    
    // Check and add deletedAt to SpecialEntry table
    console.log('🔍 Checking SpecialEntry table for deletedAt column...');
    const specialSchema = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'SpecialEntry'
      AND column_name = 'deletedAt'
    `;
    
    if (specialSchema.length === 0) {
      console.log('➕ Adding deletedAt column to SpecialEntry table...');
      await prisma.$executeRaw`ALTER TABLE "SpecialEntry" ADD COLUMN "deletedAt" TIMESTAMP`;
      console.log('✅ Added deletedAt to SpecialEntry');
    } else {
      console.log('✅ SpecialEntry already has deletedAt column');
    }
    
    // Check and add deletedBy to SpecialEntry table
    console.log('🔍 Checking SpecialEntry table for deletedBy column...');
    const specialDeletedBy = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'SpecialEntry'
      AND column_name = 'deletedBy'
    `;
    
    if (specialDeletedBy.length === 0) {
      console.log('➕ Adding deletedBy column to SpecialEntry table...');
      await prisma.$executeRaw`ALTER TABLE "SpecialEntry" ADD COLUMN "deletedBy" TEXT`;
      console.log('✅ Added deletedBy to SpecialEntry');
    } else {
      console.log('✅ SpecialEntry already has deletedBy column');
    }
    
    // Check and add deletedAt to Transaction table
    console.log('🔍 Checking Transaction table for deletedAt column...');
    const transactionSchema = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Transaction'
      AND column_name = 'deletedAt'
    `;
    
    if (transactionSchema.length === 0) {
      console.log('➕ Adding deletedAt column to Transaction table...');
      await prisma.$executeRaw`ALTER TABLE "Transaction" ADD COLUMN "deletedAt" TIMESTAMP`;
      console.log('✅ Added deletedAt to Transaction');
    } else {
      console.log('✅ Transaction already has deletedAt column');
    }
    
    // Check and add deletedBy to Transaction table
    console.log('🔍 Checking Transaction table for deletedBy column...');
    const transactionDeletedBy = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Transaction'
      AND column_name = 'deletedBy'
    `;
    
    if (transactionDeletedBy.length === 0) {
      console.log('➕ Adding deletedBy column to Transaction table...');
      await prisma.$executeRaw`ALTER TABLE "Transaction" ADD COLUMN "deletedBy" TEXT`;
      console.log('✅ Added deletedBy to Transaction');
    } else {
      console.log('✅ Transaction already has deletedBy column');
    }
    
    // Verify all changes
    console.log('🔍 Verifying final schema...');
    const hawalaFinal = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'Hawala' 
      ORDER BY ordinal_position
    `;
    console.log('📊 Hawala columns:', hawalaFinal.map(c => c.column_name));
    
    const specialFinal = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'SpecialEntry' 
      ORDER BY ordinal_position
    `;
    console.log('📊 SpecialEntry columns:', specialFinal.map(c => c.column_name));
    
    const transactionFinal = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'Transaction' 
      ORDER BY ordinal_position
    `;
    console.log('📊 Transaction columns:', transactionFinal.map(c => c.column_name));
    
    await prisma.$disconnect();
    console.log('🎉 Production database schema fix completed!');
    
  } catch (error) {
    console.error('❌ Error adding deletedAt columns:', error.message);
    process.exit(1);
  }
}

// Run the fix
addDeletedAtColumns();
