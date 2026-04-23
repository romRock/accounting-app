import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mock data
const mockUsers = [
  {
    id: '1',
    email: 'admin@angadiya.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    role: { name: 'Super Admin', permissions: { 'transactions.create': true, 'transactions.read': true } }
  }
];

const mockTransactions = [
  {
    id: '1',
    transactionId: 'TRX001',
    date: '2024-01-15',
    type: 'INWARD',
    fromCity: { name: 'Mumbai' },
    toCity: { name: 'Delhi' },
    party: { name: 'ABC Company' },
    amount: 10000,
    commission: 100,
    status: 'COMPLETED'
  }
];

// Simple authentication endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@angadiya.com' && password === 'admin123') {
    const user = mockUsers[0];
    res.json({
      user,
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected routes middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Mock authentication - in production, verify JWT
  req.user = mockUsers[0];
  next();
};

// Mock transactions endpoints
app.get('/api/transactions', authenticateToken, (req, res) => {
  res.json({
    transactions: mockTransactions,
    total: mockTransactions.length
  });
});

app.get('/api/transactions/stats', authenticateToken, (req, res) => {
  res.json({
    totalTransactions: 1,
    totalAmount: 10000,
    totalCommission: 100,
    inwardTransactions: 1,
    outwardTransactions: 0,
    pendingTransactions: 0,
    completedTransactions: 1
  });
});

app.post('/api/transactions', authenticateToken, (req, res) => {
  const newTransaction = {
    id: Date.now().toString(),
    transactionId: `TRX${Date.now()}`,
    ...req.body,
    status: 'COMPLETED'
  };
  mockTransactions.push(newTransaction);
  res.json({ transaction: newTransaction });
});

// Mock accounting endpoints
app.get('/api/accounting', authenticateToken, (req, res) => {
  res.json({
    ledgerEntries: [
      {
        id: '1',
        date: '2024-01-15',
        accountId: 'PARTY1',
        accountType: 'PARTY',
        description: 'Transaction TRX001',
        debitAmount: 10000,
        creditAmount: 0,
        balance: 10000
      }
    ]
  });
});

app.get('/api/accounting/balance', authenticateToken, (req, res) => {
  res.json({
    currentBalance: 50000
  });
});

// Mock reports endpoints
app.get('/api/reports/inward', authenticateToken, (req, res) => {
  res.json({
    transactions: mockTransactions.filter(t => t.type === 'INWARD'),
    summary: {
      totalTransactions: 1,
      totalAmount: 10000,
      totalCommission: 100
    }
  });
});

app.get('/api/reports/outward', authenticateToken, (req, res) => {
  res.json({
    transactions: mockTransactions.filter(t => t.type === 'OUTWARD'),
    summary: {
      totalTransactions: 0,
      totalAmount: 0,
      totalCommission: 0
    }
  });
});

// Mock master data endpoints
app.get('/api/master/cities', authenticateToken, (req, res) => {
  res.json({
    cities: [
      { id: '1', name: 'Mumbai', code: 'MUM', isActive: true },
      { id: '2', name: 'Delhi', code: 'DEL', isActive: true },
      { id: '3', name: 'Bangalore', code: 'BLR', isActive: true }
    ]
  });
});

app.get('/api/master/parties', authenticateToken, (req, res) => {
  res.json({
    parties: [
      { id: '1', name: 'ABC Company', phone: '9876543210', isActive: true },
      { id: '2', name: 'XYZ Traders', phone: '9876543211', isActive: true }
    ]
  });
});

// Mock balance sheet endpoints
app.get('/api/balance-sheet', authenticateToken, (req, res) => {
  res.json({
    balanceSheets: [
      {
        id: '1',
        date: '2024-01-15',
        openingBalance: 40000,
        closingBalance: 50000,
        totalAssets: 75000,
        totalLiabilities: 25000,
        totalEquity: 50000
      }
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
});

export default app;
