import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllUsers() {
  try {
    const users = await prisma.user.findMany({
      include: { branch: true, role: true },
      orderBy: { username: 'asc' }
    });

    console.log('👥 All Users in Database:');
    console.log('='.repeat(80));
    
    users.forEach(user => {
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role?.name}`);
      console.log(`Branch: ${user.branch?.name || 'None'}`);
      console.log(`Branch ID: ${user.branchId || 'None'}`);
      console.log(`-`.repeat(40));
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllUsers();
