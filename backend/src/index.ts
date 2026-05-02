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
import { authenticateToken, requireRole } from './modules/auth/middleware';
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

// Cities CRUD API endpoints - 3 separate POST endpoints

// Simple test endpoint to verify server is working
app.get('/api/test/status', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check token payload transmission
app.post('/api/debug/token', authenticateToken, async (req, res) => {
  try {
    console.log('=== TOKEN PAYLOAD DEBUG ===');
    console.log('Auth header:', req.headers.authorization);
    console.log('User from token:', req.user);
    console.log('User role:', req.user?.role?.name);
    console.log('User permissions:', req.user?.role?.permissions);
    
    res.json({
      success: true,
      message: 'Token payload received successfully',
      tokenInfo: {
        userId: req.user?.id,
        email: req.user?.email,
        username: req.user?.username,
        role: req.user?.role?.name,
        permissions: req.user?.role?.permissions,
        hasAdminRole: ['Admin', 'Super Admin'].includes(req.user?.role?.name || '')
      }
    });
  } catch (error) {
    console.error('Token debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Token debug failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint to check JWT configuration
app.get('/api/debug/jwt', (req, res) => {
  try {
    console.log('=== JWT CONFIG DEBUG ===');
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
    console.log('JWT_SECRET value:', process.env.JWT_SECRET ? 'SET' : 'NOT_SET');
    console.log('Fallback secret:', 'your-secret-key');
    
    res.json({
      success: true,
      jwtConfig: {
        secretExists: !!process.env.JWT_SECRET,
        secretLength: process.env.JWT_SECRET?.length || 0,
        fallbackSecret: 'your-secret-key',
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    console.error('JWT debug error:', error);
    res.status(500).json({
      success: false,
      message: 'JWT debug failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint (no authentication) for debugging
app.post('/api/cities/test', async (req, res) => {
  try {
    console.log('=== TEST CITY API CALLED ===');
    console.log('Request body:', req.body);
    
    const { name, code, state, number } = req.body;
    
    // Validate required fields
    if (!name || !code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, and state are required'
      });
    }

    res.json({
      success: true,
      message: 'Test endpoint working - authentication bypassed',
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        state: state.trim(),
        number: number || null
      }
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add new city (Admin only)
app.post('/api/cities/add', authenticateToken, requireRole(['Admin', 'Super Admin']), async (req, res) => {
  try {
    console.log('=== ADD CITY API CALLED ===');
    console.log('Request body:', req.body);
    console.log('Authorization header:', req.headers.authorization);
    console.log('User:', req.user);
    console.log('User role:', req.user?.role?.name);

    const { name, code, state, number } = req.body;
    
    // Validate required fields
    if (!name || !code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, and state are required'
      });
    }

    // Add debug info
    console.log('Creating PrismaClient...');
    const prisma = new PrismaClient();
    console.log('PrismaClient created successfully');
    
    // Check if city with same name or code already exists
    console.log('Checking for existing city...');
    const existingCity = await prisma.city.findFirst({
      where: {
        OR: [
          { name: name.trim(), isActive: true, isDeleted: false },
          { code: code.trim().toUpperCase(), isActive: true, isDeleted: false }
        ]
      }
    });
    console.log('Existing city check completed');

    if (existingCity) {
      return res.status(409).json({
        success: false,
        message: 'City with this name or code already exists'
      });
    }

    // Generate address
    const address = state ? `${name.trim()}, ${state.trim()}` : name.trim();

    // Create new city
    console.log('Creating new city...');
    const newCity = await prisma.city.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        state: state.trim(),
        address: address,
        number: number || null,
        isActive: true,
        isDeleted: false
      }
    });
    console.log('City created successfully');

    console.log(`=== CITY ADDED: ${newCity.name} (${newCity.code}) by ${req.user?.username} ===`);

    res.status(201).json({
      success: true,
      message: 'City added successfully',
      data: {
        id: newCity.id,
        name: newCity.name,
        code: newCity.code,
        state: newCity.state,
        address: newCity.address,
        number: newCity.number
      }
    });

  } catch (error) {
    console.error('=== ADD CITY ERROR ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    res.status(500).json({
      success: false,
      message: 'Failed to add city',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Temporary test endpoint without authentication
app.post('/api/cities/add-test', async (req, res) => {
  try {
    console.log('=== ADD CITY TEST API CALLED ===');
    console.log('Request body:', req.body);

    const { name, code, state, number } = req.body;
    
    // Validate required fields
    if (!name || !code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, and state are required'
      });
    }

    const prisma = new PrismaClient();
    
    // Check if city with same name or code already exists
    const existingCity = await prisma.city.findFirst({
      where: {
        OR: [
          { name: name.trim(), isActive: true, isDeleted: false },
          { code: code.trim().toUpperCase(), isActive: true, isDeleted: false }
        ]
      }
    });

    if (existingCity) {
      return res.status(409).json({
        success: false,
        message: 'City with this name or code already exists'
      });
    }

    // Generate address
    const address = state ? `${name.trim()}, ${state.trim()}` : name.trim();

    // Create new city
    const newCity = await prisma.city.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        state: state.trim(),
        address: address,
        number: number || null,
        isActive: true,
        isDeleted: false
      }
    });

    console.log(`=== CITY ADDED (TEST): ${newCity.name} (${newCity.code}) ===`);

    res.status(201).json({
      success: true,
      message: 'City added successfully (test)',
      data: {
        id: newCity.id,
        name: newCity.name,
        code: newCity.code,
        state: newCity.state,
        address: newCity.address,
        number: newCity.number
      }
    });

  } catch (error) {
    console.error('=== ADD CITY TEST ERROR ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    res.status(500).json({
      success: false,
      message: 'Failed to add city (test)',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update city (Admin only)

// Update city (Admin only)
app.post('/api/cities/update', authenticateToken, requireRole(['Admin', 'Super Admin']), async (req, res) => {
  try {
    console.log('=== UPDATE CITY API CALLED ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const { id, name, code, state, number } = req.body;
    
    // Validate required fields
    if (!id || !name || !code || !state) {
      return res.status(400).json({
        success: false,
        message: 'ID, name, code, and state are required'
      });
    }

    const prisma = new PrismaClient();
    
    // Check if city exists
    const existingCity = await prisma.city.findFirst({
      where: {
        id: id,
        isActive: true,
        isDeleted: false
      }
    });

    if (!existingCity) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    // Check if another city with same name or code already exists
    const duplicateCity = await prisma.city.findFirst({
      where: {
        id: { not: id },
        OR: [
          { name: name.trim(), isActive: true, isDeleted: false },
          { code: code.trim().toUpperCase(), isActive: true, isDeleted: false }
        ]
      }
    });

    if (duplicateCity) {
      return res.status(409).json({
        success: false,
        message: 'City with this name or code already exists'
      });
    }

    // Generate address
    const address = state ? `${name.trim()}, ${state.trim()}` : name.trim();

    // Update city
    const updatedCity = await prisma.city.update({
      where: { id: id },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        state: state.trim(),
        address: address,
        number: number || null,
        updatedAt: new Date()
      }
    });

    console.log(`=== CITY UPDATED: ${updatedCity.name} (${updatedCity.code}) by ${req.user?.username} ===`);

    res.json({
      success: true,
      message: 'City updated successfully',
      data: {
        id: updatedCity.id,
        name: updatedCity.name,
        code: updatedCity.code,
        state: updatedCity.state,
        address: updatedCity.address,
        number: updatedCity.number
      }
    });

  } catch (error) {
    console.error('Error updating city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update city',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete city (Admin only - soft delete)
app.post('/api/cities/delete', authenticateToken, requireRole(['Admin', 'Super Admin']), async (req, res) => {
  try {
    console.log('=== DELETE CITY API CALLED ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'City ID is required'
      });
    }

    // Check if city exists
    const existingCity = await prisma.city.findFirst({
      where: {
        id: id,
        isActive: true,
        isDeleted: false
      }
    });

    if (!existingCity) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    // Soft delete city
    console.log('=== DELETING CITY FROM DATABASE ===');
    console.log('City to delete:', existingCity.name, 'ID:', id);
    
    const result = await prisma.city.update({
      where: { id: id },
      data: {
        isActive: false,
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    console.log('Database update result:', result);
    console.log(`=== CITY DELETED: ${existingCity.name} (${existingCity.code}) by ${req.user?.username} ===`);

    res.json({
      success: true,
      message: 'City deleted successfully',
      data: {
        id: result.id,
        name: result.name,
        code: result.code,
        isActive: result.isActive,
        isDeleted: result.isDeleted
      }
    });

  } catch (error) {
    console.error('=== DELETE CITY ERROR ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete city',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test delete endpoint without authentication
app.post('/api/cities/delete-test', async (req, res) => {
  try {
    console.log('=== DELETE TEST API CALLED ===');
    console.log('Request body:', req.body);

    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'City ID is required'
      });
    }

    // Check if city exists
    const existingCity = await prisma.city.findFirst({
      where: {
        id: id,
        isActive: true,
        isDeleted: false
      }
    });

    if (!existingCity) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    // Soft delete city
    console.log('=== DELETING CITY FROM DATABASE ===');
    console.log('City to delete:', existingCity.name, 'ID:', id);
    
    const result = await prisma.city.update({
      where: { id: id },
      data: {
        isActive: false,
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    console.log('Database update completed:', result);
    console.log(`=== CITY DELETED: ${existingCity.name} (${existingCity.code}) ===`);

    res.json({
      success: true,
      message: 'City deleted successfully (test)',
      data: {
        id: result.id,
        name: result.name,
        code: result.code,
        isActive: result.isActive,
        isDeleted: result.isDeleted
      }
    });

  } catch (error) {
    console.error('=== DELETE TEST ERROR ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete city (test)',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clients CRUD API endpoints - 3 separate POST endpoints

// Add new client (Admin only)
app.post('/api/clients/add', authenticateToken, requireRole(['Admin', 'Super Admin']), async (req, res) => {
  try {
    console.log('=== ADD CLIENT API CALLED ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    console.log('User role:', req.user?.role?.name);

    const { name, mobileNumber, city, notes } = req.body;
    
    // Validate required fields
    if (!name || !mobileNumber || !city) {
      return res.status(400).json({
        success: false,
        message: 'Name, mobile number, and city are required'
      });
    }

    // Check if client with same mobile number already exists
    const existingClient = await prisma.party.findFirst({
      where: {
        phone: mobileNumber.trim(),
        isActive: true,
        isDeleted: false
      }
    });

    if (existingClient) {
      return res.status(409).json({
        success: false,
        message: 'Client with this mobile number already exists'
      });
    }

    // Find city or create if not exists
    let cityRecord = await prisma.city.findFirst({
      where: {
        name: city.trim(),
        isActive: true,
        isDeleted: false
      }
    });

    // If city doesn't exist, create it automatically
    if (!cityRecord) {
      console.log('=== CREATING NEW CITY FOR CLIENT ===');
      console.log('City name:', city.trim());
      
      // Generate a unique code for the city
      const cityCode = city.trim().toUpperCase().replace(/\s+/g, '').substring(0, 3) + Math.random().toString(36).substring(2, 5).toUpperCase();
      
      cityRecord = await prisma.city.create({
        data: {
          name: city.trim(),
          code: cityCode,
          state: 'Unknown', // Default state since it's auto-created
          address: `${city.trim()}, Unknown`, // Auto-generate address
          isActive: true,
          isDeleted: false
        }
      });
      
      console.log(`=== CITY AUTO-CREATED: ${cityRecord.name} (${cityRecord.code}) ===`);
    }

    // Create new client
    const newClient = await prisma.party.create({
      data: {
        name: name.trim(),
        phone: mobileNumber.trim(),
        cityId: cityRecord.id,
        address: notes || null,
        isActive: true,
        isDeleted: false
      }
    });

    console.log(`=== CLIENT ADDED: ${newClient.name} (${newClient.phone}) by ${req.user?.username} ===`);

    res.status(201).json({
      success: true,
      message: 'Client added successfully',
      data: {
        id: newClient.id,
        name: newClient.name,
        mobileNumber: newClient.phone,
        city: cityRecord.name,
        notes: newClient.address,
        createdAt: newClient.createdAt,
        updatedAt: newClient.updatedAt
      }
    });

  } catch (error) {
    console.error('Error adding client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update client (Admin only)
app.post('/api/clients/update', authenticateToken, requireRole(['Admin', 'Super Admin']), async (req, res) => {
  try {
    console.log('=== UPDATE CLIENT API CALLED ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const { id, name, mobileNumber, city, notes } = req.body;
    
    // Validate required fields
    if (!id || !name || !mobileNumber || !city) {
      return res.status(400).json({
        success: false,
        message: 'ID, name, mobile number, and city are required'
      });
    }

    // Check if client exists
    const existingClient = await prisma.party.findFirst({
      where: {
        id: id,
        isActive: true,
        isDeleted: false
      }
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Find city or create if not exists
    let cityRecord = await prisma.city.findFirst({
      where: {
        name: city.trim(),
        isActive: true,
        isDeleted: false
      }
    });

    // If city doesn't exist, create it automatically
    if (!cityRecord) {
      console.log('=== CREATING NEW CITY FOR CLIENT UPDATE ===');
      console.log('City name:', city.trim());
      
      // Generate a unique code for the city
      const cityCode = city.trim().toUpperCase().replace(/\s+/g, '').substring(0, 3) + Math.random().toString(36).substring(2, 5).toUpperCase();
      
      cityRecord = await prisma.city.create({
        data: {
          name: city.trim(),
          code: cityCode,
          state: 'Unknown', // Default state since it's auto-created
          address: `${city.trim()}, Unknown`, // Auto-generate address
          isActive: true,
          isDeleted: false
        }
      });
      
      console.log(`=== CITY AUTO-CREATED FOR UPDATE: ${cityRecord.name} (${cityRecord.code}) ===`);
    }

    // Check if another client has the same mobile number
    const duplicateClient = await prisma.party.findFirst({
      where: {
        phone: mobileNumber.trim(),
        isActive: true,
        isDeleted: false,
        id: { not: id }
      }
    });

    if (duplicateClient) {
      return res.status(409).json({
        success: false,
        message: 'Another client with this mobile number already exists'
      });
    }

    // Update client
    const updatedClient = await prisma.party.update({
      where: { id: id },
      data: {
        name: name.trim(),
        phone: mobileNumber.trim(),
        cityId: cityRecord.id,
        address: notes || null,
        updatedAt: new Date()
      }
    });

    console.log(`=== CLIENT UPDATED: ${updatedClient.name} (${updatedClient.phone}) by ${req.user?.username} ===`);

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: {
        id: updatedClient.id,
        name: updatedClient.name,
        mobileNumber: updatedClient.phone,
        city: cityRecord.name,
        notes: updatedClient.address,
        updatedAt: updatedClient.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete client (Admin only - soft delete)
app.post('/api/clients/delete', authenticateToken, requireRole(['Admin', 'Super Admin']), async (req, res) => {
  try {
    console.log('=== DELETE CLIENT API CALLED ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    // Check if client exists
    const existingClient = await prisma.party.findFirst({
      where: {
        id: id,
        isActive: true,
        isDeleted: false
      }
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Soft delete client
    await prisma.party.update({
      where: { id: id },
      data: {
        isActive: false,
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    console.log(`=== CLIENT DELETED: ${existingClient.name} (${existingClient.phone}) by ${req.user?.username} ===`);

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all clients (with authentication)
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    console.log('=== GET CLIENTS API CALLED ===');
    console.log('User:', req.user);

    const clients = await prisma.party.findMany({
      where: {
        isActive: true,
        isDeleted: false
      },
      include: {
        city: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to match frontend Client interface
    const transformedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      mobileNumber: client.phone,
      city: client.city.name,
      notes: client.address,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString()
    }));

    console.log(`=== CLIENTS FETCHED: ${transformedClients.length} clients ===`);

    res.json({
      success: true,
      data: transformedClients
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients',
      error: error instanceof Error ? error.message : 'Unknown error'
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
