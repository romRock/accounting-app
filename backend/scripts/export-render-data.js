const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app'
    }
  }
});

async function exportData() {
  console.log('🚀 Starting data export from Render database...');

  try {
    // Export Roles
    console.log('📦 Exporting roles...');
    const roles = await prisma.role.findMany({
      where: { isActive: true, isDeleted: false }
    });
    fs.writeFileSync(
      path.join(__dirname, 'export-roles.json'),
      JSON.stringify(roles, null, 2)
    );
    console.log(`✅ Exported ${roles.length} roles`);

    // Export Cities
    console.log('📦 Exporting cities...');
    const cities = await prisma.city.findMany({
      where: { isActive: true, isDeleted: false }
    });
    fs.writeFileSync(
      path.join(__dirname, 'export-cities.json'),
      JSON.stringify(cities, null, 2)
    );
    console.log(`✅ Exported ${cities.length} cities`);

    // Export Users
    console.log('📦 Exporting users...');
    const users = await prisma.user.findMany({
      where: { isActive: true, isDeleted: false },
      include: { role: true }
    });
    fs.writeFileSync(
      path.join(__dirname, 'export-users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`✅ Exported ${users.length} users`);

    // Export Account Categories
    console.log('📦 Exporting account categories...');
    const accountCategories = await prisma.accountCategory.findMany({
      where: { isActive: true, isDeleted: false }
    });
    fs.writeFileSync(
      path.join(__dirname, 'export-account-categories.json'),
      JSON.stringify(accountCategories, null, 2)
    );
    console.log(`✅ Exported ${accountCategories.length} account categories`);

    // Export Branches
    console.log('📦 Exporting branches...');
    const branches = await prisma.branch.findMany({
      where: { isActive: true, isDeleted: false }
    });
    fs.writeFileSync(
      path.join(__dirname, 'export-branches.json'),
      JSON.stringify(branches, null, 2)
    );
    console.log(`✅ Exported ${branches.length} branches`);

    // Export Commission Rates
    console.log('📦 Exporting commission rates...');
    const commissionRates = await prisma.commissionRate.findMany({
      where: { isActive: true, isDeleted: false }
    });
    fs.writeFileSync(
      path.join(__dirname, 'export-commission-rates.json'),
      JSON.stringify(commissionRates, null, 2)
    );
    console.log(`✅ Exported ${commissionRates.length} commission rates`);

    console.log('\n✅ All data exported successfully!');
    console.log('📁 Export files created in backend/scripts/');
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
