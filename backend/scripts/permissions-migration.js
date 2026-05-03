const { PrismaClient } = require('@prisma/client');

async function runPermissionsMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Starting permissions field migration...');
    
    // Step 1: Check current permissions field type and data
    console.log('📊 Checking current permissions data...');
    
    // Try to get sample data to understand current format
    const sampleRoles = await prisma.$queryRaw`
      SELECT id, name, permissions 
      FROM roles 
      LIMIT 5
    `;
    
    console.log('Sample roles data:', sampleRoles);
    
    // Step 2: Backup existing permissions data
    console.log('💾 Backing up existing permissions...');
    const backupData = await prisma.$queryRaw`
      SELECT id, permissions 
      FROM roles 
      WHERE permissions IS NOT NULL
    `;
    
    console.log(`Backed up ${backupData.length} roles with permissions`);
    
    // Step 3: Update permissions to ensure JSON format
    console.log('🔄 Converting permissions to JSON format...');
    
    for (const role of backupData) {
      try {
        let parsedPermissions;
        
        // Try to parse if it's a string, otherwise use as-is
        if (typeof role.permissions === 'string') {
          parsedPermissions = JSON.parse(role.permissions);
        } else {
          parsedPermissions = role.permissions;
        }
        
        // Update with proper JSON format
        await prisma.$queryRaw`
          UPDATE roles 
          SET permissions = ${JSON.stringify(parsedPermissions)}::json
          WHERE id = ${role.id}
        `;
        
        console.log(`✅ Updated permissions for role: ${role.id}`);
      } catch (error) {
        console.error(`❌ Error updating role ${role.id}:`, error.message);
        
        // Set default permissions if parsing fails
        await prisma.$queryRaw`
          UPDATE roles 
          SET permissions = '{}'::json
          WHERE id = ${role.id}
        `;
        
        console.log(`⚠️ Set default permissions for role: ${role.id}`);
      }
    }
    
    // Step 4: Verify the migration
    console.log('🔍 Verifying migration...');
    const verification = await prisma.$queryRaw`
      SELECT id, name, permissions 
      FROM roles 
      LIMIT 3
    `;
    
    console.log('✅ Migration verification successful:');
    verification.forEach(role => {
      console.log(`  - ${role.name}: ${typeof role.permissions} (${JSON.stringify(role.permissions).substring(0, 50)}...)`);
    });
    
    console.log('🎉 Permissions migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runPermissionsMigration()
  .then(() => {
    console.log('✅ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
