const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('🔍 Checking admin user in database...');
    
    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@mail.com' },
      include: { role: true }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log('  Email:', adminUser.email);
      console.log('  Username:', adminUser.username);
      console.log('  Role:', adminUser.role?.name);
      console.log('  Active:', adminUser.isActive);
      console.log('  Password hash length:', adminUser.password.length);
      
      // Test password verification
      const isPasswordCorrect = await bcrypt.compare('admin@1234', adminUser.password);
      console.log('  Password verification:', isPasswordCorrect ? '✅ SUCCESS' : '❌ FAILED');
      
      if (!isPasswordCorrect) {
        // Try with old password
        const isOldPasswordCorrect = await bcrypt.compare('admin123', adminUser.password);
        console.log('  Old password test:', isOldPasswordCorrect ? '✅ OLD PASSWORD WORKS' : '❌ OLD PASSWORD FAILED');
        
        if (isOldPasswordCorrect) {
          console.log('🔧 ISSUE: Password was seeded with old password, updating...');
          
          // Update password to new one
          const newHashedPassword = await bcrypt.hash('admin@1234', 10);
          await prisma.user.update({
            where: { email: 'admin@mail.com' },
            data: { password: newHashedPassword }
          });
          
          console.log('✅ Password updated to: admin@1234');
        }
      }
    } else {
      console.log('❌ Admin user NOT found');
      
      // Check if user exists with different email
      const allUsers = await prisma.user.findMany({
        where: { isActive: true, isDeleted: false }
      });
      
      console.log('📋 All active users:');
      allUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.username})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
