import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import rateLimit from 'express-rate-limit'; // Disabled for continuous accountant work
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import authRoutes from './modules/auth/routes';
import transactionRoutes from './modules/transactions/routes';
import accountingRoutes from './modules/accounting/routes';
import reportsRoutes from './modules/reports/routes';
import masterRoutes from './modules/master/routes';
import hawalaRoutes from './modules/hawala/routes';
import specialEntryRoutes from './modules/specialEntry/routes';
import dashboardRoutes from './modules/dashboard/routes';
import { authenticateToken, requireRole } from './modules/auth/middleware';
import { requireAdmin } from './middlewares/rbac';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const prisma = new PrismaClient();

async function doesColumnExist(tableName: string, columnName: string) {
  const result = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND column_name = ${columnName}
  `;
  return result.length > 0;
}

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

    // Check and add missing columns to account_entries table if needed
    console.log('🔍 Checking account_entries table columns...');
    try {
      const hasDeletedAt = await doesColumnExist('account_entries', 'deletedAt');
      if (!hasDeletedAt) {
        console.log('🗄️ Adding deletedAt column to account_entries...');
        await prisma.$executeRaw`ALTER TABLE "account_entries" ADD COLUMN "deletedAt" TIMESTAMP(3);`;
        console.log('✅ deletedAt column added');
      }

      const hasDeletedBy = await doesColumnExist('account_entries', 'deletedBy');
      if (!hasDeletedBy) {
        console.log('🗄️ Adding deletedBy column to account_entries...');
        await prisma.$executeRaw`ALTER TABLE "account_entries" ADD COLUMN "deletedBy" TEXT;`;
        console.log('✅ deletedBy column added');
      }

      console.log('✅ account_entries table columns verified');
    } catch (error: any) {
      console.error('❌ Error checking account_entries table columns:', error);
    }

    // Check and add missing columns to ledger_entries table if needed
    console.log('🔍 Checking ledger_entries table columns...');
    try {
      const hasDeletedAt = await doesColumnExist('ledger_entries', 'deletedAt');
      if (!hasDeletedAt) {
        console.log('🗄️ Adding deletedAt column to ledger_entries...');
        await prisma.$executeRaw`ALTER TABLE "ledger_entries" ADD COLUMN "deletedAt" TIMESTAMP(3);`;
        console.log('✅ deletedAt column added');
      }

      const hasDeletedBy = await doesColumnExist('ledger_entries', 'deletedBy');
      if (!hasDeletedBy) {
        console.log('🗄️ Adding deletedBy column to ledger_entries...');
        await prisma.$executeRaw`ALTER TABLE "ledger_entries" ADD COLUMN "deletedBy" TEXT;`;
        console.log('✅ deletedBy column added');
      }

      console.log('✅ ledger_entries table columns verified');
    } catch (error: any) {
      console.error('❌ Error checking ledger_entries table columns:', error);
    }

    // Check and create Hawala table if needed
    console.log('🔍 Checking Hawala table...');
    try {
      await prisma.hawala.findFirst();
      console.log('✅ Hawala table already exists');
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        console.log('🗄️ Creating Hawala table...');

        // Create Hawala table using raw SQL
        await prisma.$executeRaw`
          CREATE TABLE "Hawala" (
            "id" TEXT NOT NULL,
            "transactionId" TEXT NOT NULL,
            "tokenNo" INTEGER,
            "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "partyA" TEXT NOT NULL,
            "partyB" TEXT NOT NULL,
            "amount" INTEGER NOT NULL,
            "remark" TEXT,
            "status" BOOLEAN NOT NULL DEFAULT true,
            "statusTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "isDeleted" BOOLEAN NOT NULL DEFAULT false,
            "branchId" TEXT,
            "createdBy" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "Hawala_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "Hawala_transactionId_key" UNIQUE ("transactionId")
          );
        `;
        
        // Create indexes
        await prisma.$executeRaw`CREATE INDEX "Hawala_transactionId_idx" ON "Hawala"("transactionId");`;
        await prisma.$executeRaw`CREATE INDEX "Hawala_date_idx" ON "Hawala"("date");`;
        await prisma.$executeRaw`CREATE INDEX "Hawala_partyA_idx" ON "Hawala"("partyA");`;
        await prisma.$executeRaw`CREATE INDEX "Hawala_partyB_idx" ON "Hawala"("partyB");`;
        await prisma.$executeRaw`CREATE INDEX "Hawala_createdBy_idx" ON "Hawala"("createdBy");`;
        
        console.log('✅ Hawala table created successfully');
      } else {
        console.log('❌ Error checking Hawala table:', error.message);
      }
    }
    
    // Check accounting module tables
    console.log('🔍 Checking Accounting module tables...');
    
    // Check AccountCategory table
    try {
      await prisma.accountCategory.findFirst();
      console.log('✅ AccountCategory table exists');
    } catch (error: any) {
      const message = (error?.message || '').toLowerCase();
      if (message.includes('does not exist')) {
        console.log('🗄️ Creating account_categories table...');
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "account_categories" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "description" TEXT,
            "parentId" TEXT,
            "gstApplicable" BOOLEAN NOT NULL DEFAULT false,
            "tdsApplicable" BOOLEAN NOT NULL DEFAULT false,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "isDeleted" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "account_categories_pkey" PRIMARY KEY ("id")
          );
        `;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "account_categories_type_idx" ON "account_categories"("type");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "account_categories_parentId_idx" ON "account_categories"("parentId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "account_categories_createdAt_idx" ON "account_categories"("createdAt");`;
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'account_categories_parentId_fkey'
            ) THEN
              ALTER TABLE "account_categories"
                ADD CONSTRAINT "account_categories_parentId_fkey"
                FOREIGN KEY ("parentId") REFERENCES "account_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
          END;
          $$;
        `;
        console.log('✅ AccountCategory table created successfully');
      } else {
        console.log('❌ Error checking AccountCategory table:', error.message);
      }
    }
    
    // Check AccountEntry table
    try {
      await prisma.accountEntry.findFirst();
      console.log('✅ AccountEntry table exists');
    } catch (error: any) {
      const message = (error?.message || '').toLowerCase();
      if (message.includes('does not exist')) {
        console.log('🗄️ Creating account_entries table...');
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "account_entries" (
            "id" TEXT NOT NULL,
            "entryId" TEXT NOT NULL,
            "date" TIMESTAMP(3) NOT NULL,
            "categoryId" TEXT NOT NULL,
            "amount" DOUBLE PRECISION NOT NULL,
            "description" TEXT,
            "partyId" TEXT,
            "paymentMethod" TEXT,
            "referenceNo" TEXT,
            "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "tdsAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "totalAmount" DOUBLE PRECISION NOT NULL,
            "type" TEXT NOT NULL,
            "statusTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "isDeleted" BOOLEAN NOT NULL DEFAULT false,
            "branchId" TEXT,
            "createdBy" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "account_entries_pkey" PRIMARY KEY ("id")
          );
        `;
        await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "account_entries_entryId_key" ON "account_entries"("entryId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "account_entries_date_idx" ON "account_entries"("date");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "account_entries_categoryId_idx" ON "account_entries"("categoryId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "account_entries_partyId_idx" ON "account_entries"("partyId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "account_entries_type_idx" ON "account_entries"("type");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "account_entries_branchId_idx" ON "account_entries"("branchId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "account_entries_createdBy_idx" ON "account_entries"("createdBy");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "account_entries_createdAt_idx" ON "account_entries"("createdAt");`;
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'account_entries_categoryId_fkey'
            ) THEN
              ALTER TABLE "account_entries"
                ADD CONSTRAINT "account_entries_categoryId_fkey"
                FOREIGN KEY ("categoryId") REFERENCES "account_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
            END IF;
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'account_entries_partyId_fkey'
            ) THEN
              ALTER TABLE "account_entries"
                ADD CONSTRAINT "account_entries_partyId_fkey"
                FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'account_entries_branchId_fkey'
            ) THEN
              ALTER TABLE "account_entries"
                ADD CONSTRAINT "account_entries_branchId_fkey"
                FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'account_entries_createdBy_fkey'
            ) THEN
              ALTER TABLE "account_entries"
                ADD CONSTRAINT "account_entries_createdBy_fkey"
                FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
            END IF;
          END;
          $$;
        `;
        console.log('✅ AccountEntry table created successfully');
      } else {
        console.log('❌ Error checking AccountEntry table:', error.message);
      }
    }
    
    // Check ClientLedger table
    try {
      await prisma.clientLedger.findFirst();
      console.log('✅ ClientLedger table exists');
    } catch (error: any) {
      const message = (error?.message || '').toLowerCase();
      if (message.includes('does not exist')) {
        console.log('🗄️ Creating client_ledgers table...');
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "client_ledgers" (
            "id" TEXT NOT NULL,
            "clientId" TEXT NOT NULL,
            "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "lastTransactionDate" TIMESTAMP(3),
            "balanceType" TEXT NOT NULL DEFAULT 'DEBIT',
            "financialYear" TEXT NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "isDeleted" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "createdBy" TEXT NOT NULL,
            CONSTRAINT "client_ledgers_pkey" PRIMARY KEY ("id")
          );
        `;
        await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "client_ledgers_clientId_key" ON "client_ledgers"("clientId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "client_ledgers_balanceType_idx" ON "client_ledgers"("balanceType");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "client_ledgers_financialYear_idx" ON "client_ledgers"("financialYear");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "client_ledgers_createdAt_idx" ON "client_ledgers"("createdAt");`;
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'client_ledgers_clientId_fkey'
            ) THEN
              ALTER TABLE "client_ledgers"
                ADD CONSTRAINT "client_ledgers_clientId_fkey"
                FOREIGN KEY ("clientId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
            END IF;
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'client_ledgers_createdBy_fkey'
            ) THEN
              ALTER TABLE "client_ledgers"
                ADD CONSTRAINT "client_ledgers_createdBy_fkey"
                FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
            END IF;
          END;
          $$;
        `;
        console.log('✅ ClientLedger table created successfully');
      } else {
        console.log('❌ Error checking ClientLedger table:', error.message);
      }
    }
    
    // Check LedgerEntry table and missing accountEntryId column
    const ledgerTableExists = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'ledger_entries'
    `;

    if (ledgerTableExists.length === 0) {
      console.log('🗄️ Creating ledger_entries table...');
      try {
        await prisma.$executeRaw`
          CREATE TABLE "ledger_entries" (
            "id" TEXT NOT NULL,
            "date" TIMESTAMP(3) NOT NULL,
            "accountId" TEXT NOT NULL,
            "accountType" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "debitAmount" DOUBLE PRECISION,
            "creditAmount" DOUBLE PRECISION,
            "balance" DOUBLE PRECISION NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "isDeleted" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "transactionId" TEXT,
            "branchId" TEXT,
            "createdBy" TEXT NOT NULL,
            "accountEntryId" TEXT,
            CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
          );
        `;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ledger_entries_date_idx" ON "ledger_entries"("date");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ledger_entries_accountId_idx" ON "ledger_entries"("accountId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ledger_entries_accountType_idx" ON "ledger_entries"("accountType");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ledger_entries_transactionId_idx" ON "ledger_entries"("transactionId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ledger_entries_branchId_idx" ON "ledger_entries"("branchId");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ledger_entries_createdBy_idx" ON "ledger_entries"("createdBy");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt");`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ledger_entries_accountEntryId_idx" ON "ledger_entries"("accountEntryId");`;
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_branchId_fkey'
            ) THEN
              ALTER TABLE "ledger_entries"
                ADD CONSTRAINT "ledger_entries_branchId_fkey"
                FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_createdBy_fkey'
            ) THEN
              ALTER TABLE "ledger_entries"
                ADD CONSTRAINT "ledger_entries_createdBy_fkey"
                FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
            END IF;
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_accountEntryId_fkey'
            ) THEN
              ALTER TABLE "ledger_entries"
                ADD CONSTRAINT "ledger_entries_accountEntryId_fkey"
                FOREIGN KEY ("accountEntryId") REFERENCES "account_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
          END;
          $$;
        `;
        console.log('✅ LedgerEntry table created successfully');
      } catch (createError: any) {
        console.log('❌ Failed to create ledger_entries table:', createError.message);
      }
    } else {
      console.log('✅ LedgerEntry table exists');

      console.log('🛠️ Ensuring ledger_entries columns and constraints are production-ready...');
      try {
        await prisma.$executeRaw`ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "accountEntryId" TEXT;`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ledger_entries_accountEntryId_idx" ON "ledger_entries"("accountEntryId");`;
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_transactionId_fkey'
            ) THEN
              ALTER TABLE "ledger_entries" DROP CONSTRAINT "ledger_entries_transactionId_fkey";
            END IF;
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_accountEntryId_fkey'
            ) THEN
              ALTER TABLE "ledger_entries"
                ADD CONSTRAINT "ledger_entries_accountEntryId_fkey"
                FOREIGN KEY ("accountEntryId") REFERENCES "account_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
          END;
          $$;
        `;
        await prisma.ledgerEntry.findFirst();
        console.log('✅ LedgerEntry table is ready for accounting create/update');
      } catch (alterError: any) {
        console.log('❌ Failed to prepare ledger_entries table:', alterError.message);
      }
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
// const limiter = rateLimit({
//   windowMs: 25 * 60 * 1000, // 25 minutes
//   max: 10000, // limit each IP to 10000 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
// });

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
// app.use(limiter); // Disabled for continuous accountant work
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

    // Create new client - city is now separate text field, no city lookup needed
    const newClient = await prisma.party.create({
      data: {
        name: name.trim(),
        phone: mobileNumber.trim(),
        city: city.trim(), // Use city directly as text field
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
        city: city, // Use city directly from request
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

    // Update client - city is now separate text field, no city lookup needed
    const updatedClient = await prisma.party.update({
      where: { id: id },
      data: {
        name: name.trim(),
        phone: mobileNumber.trim(),
        city: city.trim(), // Use city directly as text field
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
        city: city, // Use city directly from request
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

// Get all roles (no authentication - same as cities and clients)
app.get('/api/roles', async (req, res) => {
  try {
    console.log('=== GET ROLES API CALLED ===');
    
    const prisma = new PrismaClient();
    
    // Get all roles from database
    const roles = await prisma.role.findMany({
      where: { isActive: true, isDeleted: false },
      select: {
        id: true,
        name: true,
        permissions: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Roles found:', roles.length);
    
    res.json({
      success: true,
      data: roles
    });
    
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roles',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add new role (Admin only)
app.post('/api/roles/add', authenticateToken, requireRole(['Admin', 'Super Admin']), async (req, res) => {
  try {
    console.log('=== ADD ROLE API CALLED ===');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user?.email, 'Role:', req.user?.role?.name);
    
    const { name, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }
    
    if (!permissions) {
      return res.status(400).json({
        success: false,
        message: 'Permissions are required'
      });
    }
    
    const prisma = new PrismaClient();
    
    // Check if role already exists
    const existingRole = await prisma.role.findFirst({
      where: {
        name: name,
        isActive: true,
        isDeleted: false
      }
    });
    
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }
    
    // Create new role
    const newRole = await prisma.role.create({
      data: {
        name: name,
        permissions: JSON.stringify(permissions),
        isActive: true,
        isDeleted: false
      }
    });
    
    console.log('Role created successfully:', newRole.id);
    
    res.json({
      success: true,
      message: 'Role created successfully',
      data: {
        ...newRole,
        permissions: JSON.parse(newRole.permissions as string)
      }
    });
    
  } catch (error) {
    console.error('Error adding role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add role',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update role (Admin only)
app.post('/api/roles/update', authenticateToken, requireRole(['Admin', 'Super Admin']), async (req, res) => {
  try {
    console.log('=== UPDATE ROLE API CALLED ===');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user?.email, 'Role:', req.user?.role?.name);
    
    const { id, name, permissions } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Role ID is required'
      });
    }
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }
    
    if (!permissions) {
      return res.status(400).json({
        success: false,
        message: 'Permissions are required'
      });
    }
    
    const prisma = new PrismaClient();
    
    // Check if role exists
    const existingRole = await prisma.role.findFirst({
      where: {
        id: id,
        isActive: true,
        isDeleted: false
      }
    });
    
    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Check if another role with same name exists
    const duplicateRole = await prisma.role.findFirst({
      where: {
        name: name,
        id: { not: id },
        isActive: true,
        isDeleted: false
      }
    });
    
    if (duplicateRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }
    
    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: id },
      data: {
        name: name,
        permissions: JSON.stringify(permissions)
      }
    });
    
    console.log('Role updated successfully:', updatedRole.id);
    
    res.json({
      success: true,
      message: 'Role updated successfully',
      data: {
        ...updatedRole,
        permissions: JSON.parse(updatedRole.permissions as string)
      }
    });
    
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete role (Admin only - soft delete)
app.post('/api/roles/delete', authenticateToken, requireRole(['Admin', 'Super Admin']), async (req, res) => {
  try {
    console.log('=== DELETE ROLE API CALLED ===');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user?.email, 'Role:', req.user?.role?.name);
    
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Role ID is required'
      });
    }
    
    const prisma = new PrismaClient();
    
    // Check if role exists
    const existingRole = await prisma.role.findFirst({
      where: {
        id: id,
        isActive: true,
        isDeleted: false
      }
    });
    
    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Check if role is being used by any users
    const usersWithRole = await prisma.user.count({
      where: {
        roleId: id,
        isActive: true,
        isDeleted: false
      }
    });
    
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role that is assigned to users'
      });
    }
    
    // Soft delete role
    await prisma.role.update({
      where: { id: id },
      data: {
        isDeleted: true,
        isActive: false
      }
    });
    
    console.log('Role deleted successfully:', id);
    
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all users (no authentication - same as cities, clients, roles)
app.get('/api/users', async (req, res) => {
  try {
    console.log('=== GET USERS API CALLED ===');
    
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        isDeleted: false
      },
      include: {
        role: {
          select: {
            name: true,
            permissions: true
          }
        },
        branch: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Users found:', users.length);

    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        fullName: user.firstName + ' ' + user.lastName,
        username: user.username,
        mobileNumber: user.phone,
        email: user.email,
        roleId: user.roleId,
        status: user.isActive ? 'Active' : 'Inactive',
        role: user.role?.name || '',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add new user (Admin only)
app.post('/api/users/add', authenticateToken, requireRole(['Admin', 'Super Admin']), async (req, res) => {
  try {
    console.log('=== ADD USER API CALLED ===');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user?.email, 'Role:', req.user?.role?.name);
    
    const { fullName, mobileNumber, email, password, roleId } = req.body;
    
    if (!fullName || !mobileNumber || !password || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'Full name, mobile number, password, and role are required'
      });
    }
    
    // Check if user with same mobile number already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: mobileNumber,
        isActive: true,
        isDeleted: false
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this mobile number already exists'
      });
    }
    
    // Parse full name to first and last name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username: mobileNumber, // Use mobile as username for simplicity
        firstName: firstName,
        lastName: lastName,
        phone: mobileNumber,
        email: email || null,
        password: hashedPassword,
        role: {
          connect: {
            id: roleId
          }
        },
        isActive: true,
        isDeleted: false
      }
    });
    
    console.log('User created successfully:', newUser.id);
    
    res.json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.id,
        fullName: firstName + ' ' + lastName,
        mobileNumber: mobileNumber,
        email: email || '',
        roleId: roleId,
        status: 'Active',
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update user (Admin only)
app.post('/api/users/update', authenticateToken, requireRole(['Admin', 'Super Admin']), async (req, res) => {
  try {
    console.log('=== UPDATE USER API CALLED ===');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user?.email, 'Role:', req.user?.role?.name);
    
    const { id, fullName, mobileNumber, email, password, roleId } = req.body;
    
    if (!id || !fullName || !mobileNumber || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'ID, full name, mobile number, and role are required'
      });
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: id,
        isActive: true,
        isDeleted: false
      }
    });
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if another user has same mobile number
    const duplicateUser = await prisma.user.findFirst({
      where: {
        phone: mobileNumber,
        id: { not: id },
        isActive: true,
        isDeleted: false
      }
    });
    
    if (duplicateUser) {
      return res.status(400).json({
        success: false,
        message: 'Another user with this mobile number already exists'
      });
    }
    
    // Parse full name to first and last name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Prepare update data
    const updateData: any = {
      firstName: firstName,
      lastName: lastName,
      phone: mobileNumber,
      email: email || null,
      roleId: roleId
    };
    
    // Update password only if provided
    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData
    });
    
    console.log('User updated successfully:', updatedUser.id);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser.id,
        fullName: firstName + ' ' + lastName,
        mobileNumber: mobileNumber,
        email: email || '',
        roleId: roleId,
        status: 'Active',
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete user (Admin only - soft delete)
app.post('/api/users/delete', authenticateToken, requireRole(['Admin', 'Super Admin']), async (req, res) => {
  try {
    console.log('=== DELETE USER API CALLED ===');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user?.email, 'Role:', req.user?.role?.name);
    
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: id,
        isActive: true,
        isDeleted: false
      }
    });
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Soft delete user (set isActive to false and isDeleted to true)
    const deletedUser = await prisma.user.update({
      where: { id: id },
      data: {
        isActive: false,
        isDeleted: true
      }
    });
    
    console.log('User deleted successfully:', deletedUser.id);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all clients (no authentication - same as cities)
app.get('/api/clients', async (req, res) => {
  try {
    console.log('=== GET CLIENTS API CALLED ===');

    const clients = await prisma.party.findMany({
      where: {
        isActive: true,
        isDeleted: false
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
      city: client.city || '',
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
app.use('/api/transactions', transactionRoutes);
app.use('/api/hawala', hawalaRoutes);
app.use('/api/specialEntry', specialEntryRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);
app.use('/api/master', authenticateToken, masterRoutes);
app.use('/api/dashboard', dashboardRoutes);

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

// Manual client seed endpoint for production
app.post('/api/seed/clients', async (req, res) => {
  try {
    console.log("=== MANUAL PRODUCTION CLIENT SEEDING TRIGGERED ===");
    
    const prisma = new PrismaClient();
    
    // Real clients data from local database - client city is separate from cities
    const clients = [
      { name: 'PM 3 YARD', phone: '9099916309', city: 'JND95V', address: 'YARD ' },
      { name: 'PM 4 ZANZARDA', phone: '9099967152', city: 'JND95V', address: 'JND' },
      { name: 'MADHURAM', phone: '9099912345', city: 'JND95V', address: 'JND' },
      { name: 'NAYAN BHAI', phone: '8787874040', city: 'RAJDXL', address: '' },
      { name: 'BHEDA BHAI', phone: '9090901212', city: 'JND95V', address: '' }
    ];
    
    // Check current count
    const currentCount = await prisma.party.count({
      where: { isActive: true, isDeleted: false }
    });
    
    console.log("Current clients count:", currentCount);
    
    if (currentCount >= 5) {
      return res.json({
        success: true,
        message: `Database already has ${currentCount} clients`,
        count: currentCount
      });
    }
    
    // Process clients - city is now a text field, separate from cities table
    let inserted = 0;
    let updated = 0;
    
    for (const client of clients) {
      // Check if client already exists
      const existingClient = await prisma.party.findFirst({
        where: { 
          phone: client.phone,
          isActive: true,
          isDeleted: false 
        }
      });

      if (existingClient) {
        // Update existing client
        await prisma.party.update({
          where: { id: existingClient.id },
          data: {
            name: client.name,
            phone: client.phone,
            address: client.address,
            city: client.city,
            updatedAt: new Date(),
          }
        });
        updated++;
      } else {
        // Create new client
        await prisma.party.create({
          data: {
            name: client.name,
            phone: client.phone,
            address: client.address,
            city: client.city,
            isActive: true,
            isDeleted: false,
          }
        });
        inserted++;
      }
    }
    
    // Check new count
    const newCount = await prisma.party.count({
      where: { isActive: true, isDeleted: false }
    });
    
    console.log("Clients count after seeding:", newCount);
    
    res.json({
      success: true,
      message: `Successfully seeded ${newCount} clients (${inserted} inserted, ${updated} updated)`,
      count: newCount,
      inserted,
      updated
    });
    
  } catch (error) {
    console.error("Manual client seeding failed:", error);
    res.status(500).json({
      success: false,
      message: "Client seeding failed",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Temporary client seeding endpoint without authentication
app.post('/api/temp-seed-clients', async (req, res) => {
  try {
    console.log("=== TEMPORARY CLIENT SEEDING TRIGGERED ===");
    
    const prisma = new PrismaClient();
    
    // Real clients data from local database - client city is separate from cities
    const clients = [
      { name: 'PM 3 YARD', phone: '9099916309', city: 'JND95V', address: 'YARD ' },
      { name: 'PM 4 ZANZARDA', phone: '9099967152', city: 'JND95V', address: 'JND' },
      { name: 'MADHURAM', phone: '9099912345', city: 'JND95V', address: 'JND' },
      { name: 'NAYAN BHAI', phone: '8787874040', city: 'RAJDXL', address: '' },
      { name: 'BHEDA BHAI', phone: '9090901212', city: 'JND95V', address: '' }
    ];
    
    // Check current count
    const currentCount = await prisma.party.count({
      where: { isActive: true, isDeleted: false }
    });
    
    console.log("Current clients count:", currentCount);
    
    if (currentCount >= 5) {
      return res.json({
        success: true,
        message: `Database already has ${currentCount} clients`,
        count: currentCount
      });
    }
    
    // Process clients - city is now a text field, separate from cities table
    let inserted = 0;
    let updated = 0;
    
    for (const client of clients) {
      // Check if client already exists
      const existingClient = await prisma.party.findFirst({
        where: { 
          phone: client.phone,
          isActive: true,
          isDeleted: false 
        }
      });

      if (existingClient) {
        // Update existing client
        await prisma.party.update({
          where: { id: existingClient.id },
          data: {
            name: client.name,
            phone: client.phone,
            address: client.address,
            city: client.city,
            updatedAt: new Date(),
          }
        });
        updated++;
      } else {
        // Create new client
        await prisma.party.create({
          data: {
            name: client.name,
            phone: client.phone,
            address: client.address,
            city: client.city,
            isActive: true,
            isDeleted: false,
          }
        });
        inserted++;
      }
    }
    
    // Check new count
    const newCount = await prisma.party.count({
      where: { isActive: true, isDeleted: false }
    });
    
    console.log("Clients count after seeding:", newCount);
    
    res.json({
      success: true,
      message: `Successfully seeded ${newCount} clients (${inserted} inserted, ${updated} updated)`,
      count: newCount,
      inserted,
      updated
    });
    
  } catch (error) {
    console.error("Temporary client seeding failed:", error);
    res.status(500).json({
      success: false,
      message: "Client seeding failed",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
