import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import authRoutes from './modules/auth/routes';
import transactionRoutes from './modules/transactions/routes';
import accountingRoutes from './modules/accounting/routes';
import reportsRoutes from './modules/reports/routes';
import masterRoutes from './modules/master/routes';
import { authenticateToken } from './modules/auth/middleware';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const prisma = new PrismaClient();

// Enhanced database connection and admin seeding
async function initializeDatabase() {
  try {
    console.log('🔍 Connecting to database...');
    console.log('📊 DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
    
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if admin user exists, create if not
    console.log('🔍 Checking admin user...');
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@mail.com' },
      include: { role: true }
    });
    
    if (!existingAdmin) {
      console.log('👤 Admin user not found, creating...');
      
      // Ensure admin role exists
      let adminRole = await prisma.role.findUnique({
        where: { name: 'Admin' }
      });
      
      if (!adminRole) {
        console.log('🔑 Creating Admin role...');
        adminRole = await prisma.role.create({
          data: {
            name: 'Admin',
            description: 'Full system administrator',
            permissions: JSON.stringify({
              users: { read: true, write: true, delete: true },
              roles: { read: true, write: true, delete: true },
              cities: { read: true, write: true, delete: true },
              parties: { read: true, write: true, delete: true },
              branches: { read: true, write: true, delete: true },
              transactions: { read: true, write: true, delete: true },
              accounting: { read: true, write: true, delete: true },
              reports: { read: true, write: true },
              dashboard: { read: true },
            }),
            isActive: true,
          },
        });
      }
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin@1234', 10);
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@mail.com',
          username: 'admin',
          password: hashedPassword,
          firstName: 'System',
          lastName: 'Administrator',
          phone: '+91-9876543210',
          roleId: adminRole.id,
          isActive: true,
        },
      });
      
      console.log('✅ Admin user created successfully');
      console.log('📋 Login credentials: admin@mail.com / admin@1234');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    console.log('🚀 Database initialization complete');
    
  } catch (error: any) {
    console.error('❌ Database initialization failed:', error);
    console.error('🔍 Error details:', error.message);
    
    // Check for common issues
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
      console.error('💡 Possible solution: Check DATABASE_URL environment variable');
    }
    if (error.message?.includes('authentication failed')) {
      console.error('💡 Possible solution: Check database credentials in DATABASE_URL');
    }
    
    // Don't exit the process, let the server continue
    console.log('⚠️  Server will continue running, but database features may be limited');
  }
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allowed origins for development and production
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://accounting-24x7.vercel.app',
      'https://accounting-app-ttqe.onrender.com'
    ];
    
    if (process.env.NODE_ENV === 'development') {
      // In development, allow all localhost origins
      if (origin.includes('localhost')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('🚫 CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Public cities search endpoint (for typeahead dropdown)
app.get('/api/cities', async (req, res) => {
  try {
    const { searchCities } = await import('./modules/master/controller');
    return searchCities(req, res);
  } catch (error) {
    console.error('Error loading cities controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cities',
    });
  }
});

// Manual seed endpoint for production
app.post('/api/seed/cities', async (req, res) => {
  try {
    const { seedCities } = await import('./seedCities');
    const prisma = new PrismaClient();
    
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
    
    // Run seed function
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/accounting', authenticateToken, accountingRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);
app.use('/api/master', authenticateToken, masterRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server with database initialization
async function startServer() {
  try {
    // Initialize database and create admin user if needed
    await initializeDatabase();
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
      console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS Origins: ${process.env.NODE_ENV === 'production' ? 'Production URLs' : 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
