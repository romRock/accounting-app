const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.gavswcxwqrxjkqtltdgw:o8PDyxVupbLD0WQx@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true'
    }
  }
});

async function importData() {
  console.log('🚀 Starting data import to Supabase database...');

  try {
    // Import Roles (no dependencies)
    console.log('📥 Importing roles...');
    const rolesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'export-roles.json'), 'utf8'));
    for (const role of rolesData) {
      await prisma.role.upsert({
        where: { id: role.id },
        update: {},
        create: {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isActive: role.isActive,
          isDeleted: role.isDeleted,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt
        }
      });
    }
    console.log(`✅ Imported ${rolesData.length} roles`);

    // Import Cities (no dependencies)
    console.log('📥 Importing cities...');
    const citiesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'export-cities.json'), 'utf8'));
    for (const city of citiesData) {
      await prisma.city.upsert({
        where: { id: city.id },
        update: {},
        create: {
          id: city.id,
          name: city.name,
          code: city.code,
          state: city.state,
          address: city.address,
          number: city.number,
          isActive: city.isActive,
          isDeleted: city.isDeleted,
          createdAt: city.createdAt,
          updatedAt: city.updatedAt
        }
      });
    }
    console.log(`✅ Imported ${citiesData.length} cities`);

    // Import Account Categories (no dependencies)
    console.log('📥 Importing account categories...');
    const accountCategoriesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'export-account-categories.json'), 'utf8'));
    for (const category of accountCategoriesData) {
      await prisma.accountCategory.upsert({
        where: { id: category.id },
        update: {},
        create: {
          id: category.id,
          name: category.name,
          type: category.type,
          description: category.description,
          parentId: category.parentId,
          gstApplicable: category.gstApplicable,
          tdsApplicable: category.tdsApplicable,
          isActive: category.isActive,
          isDeleted: category.isDeleted,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        }
      });
    }
    console.log(`✅ Imported ${accountCategoriesData.length} account categories`);

    // Import Users (depends on roles)
    console.log('📥 Importing users...');
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'export-users.json'), 'utf8'));
    for (const user of usersData) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email,
          username: user.username,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          isActive: user.isActive,
          isDeleted: user.isDeleted,
          roleId: user.roleId,
          branchId: user.branchId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }
    console.log(`✅ Imported ${usersData.length} users`);

    console.log('\n✅ All data imported successfully to Supabase!');
  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importData();
