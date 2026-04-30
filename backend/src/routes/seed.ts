import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Manual seed endpoint for production
router.post('/cities', async (req, res) => {
  try {
    console.log("=== MANUAL PRODUCTION SEEDING TRIGGERED ===");
    
    // Check current count
    const currentCount = await prisma.city.count({
      where: { isActive: true, isDeleted: false }
    });
    
    console.log("Current cities count:", currentCount);
    
    if (currentCount > 0) {
      return res.json({
        success: true,
        message: `Database already has ${currentCount} cities`,
        count: currentCount
      });
    }
    
    // Import and run seed function
    const { seedCities } = await import('../seedCities');
    await seedCities();
    
    // Check new count
    const newCount = await prisma.city.count({
      where: { isActive: true, isDeleted: false }
    });
    
    console.log("Cities count after seeding:", newCount);
    
    res.json({
      success: true,
      message: `Successfully seeded ${newCount} cities`,
      count: newCount
    });
    
  } catch (error) {
    console.error("Manual seeding failed:", error);
    res.status(500).json({
      success: false,
      message: "Seeding failed"
    });
  }
});

export default router;
