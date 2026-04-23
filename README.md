# Angadiya Accounting Application

A comprehensive, production-ready Transaction & Bookkeeping Web Application for Angadiya firms (cash/credit logistics across cities in India).

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + ShadCN UI
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Refresh Token
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
/accounting-app
├── /frontend (Next.js)
│   ├── /app
│   │   ├── /login
│   │   ├── /dashboard
│   │   ├── /transactions
│   │   ├── /accounting
│   │   ├── /reports
│   │   ├── /balance-sheet
│   │   ├── /master
│   │   ├── /help
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── /components
│   │   └── /ui
│   ├── /lib
│   ├── /hooks
│   ├── /store
│   └── /utils
├── /backend (Node.js + Express)
│   ├── /src
│   │   ├── /modules
│   │   │   ├── /auth
│   │   │   ├── /transactions
│   │   │   ├── /accounting
│   │   │   ├── /reports
│   │   │   └── /master
│   │   ├── /middlewares
│   │   ├── /utils
│   │   ├── /config
│   │   └── index.ts
│   ├── /prisma
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
└── /prisma
    └── schema.prisma
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd accounting-app
   ```

2. **Install dependencies**
   
   **Backend:**
   ```bash
   cd backend
   npm install
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm install
   ```

3. **Environment Setup**
   
   **Backend Environment:**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Update the `.env` file with your database credentials:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/accounting_db"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key"
   PORT=3001
   NODE_ENV="development"
   FRONTEND_URL="http://localhost:3000"
   ```

   **Frontend Environment:**
   ```bash
   cd frontend
   cp .env.example .env.local
   ```
   Update the `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   ```

4. **Database Setup**
   
   **Setup PostgreSQL:**
   ```bash
   # Create database
   createdb accounting_db
   
   # Create user (optional)
   createuser accounting_user with password 'your_password';
   grant all privileges on database accounting_db to accounting_user;
   ```

   **Run Prisma Migrations:**
   ```bash
   cd backend
   npm run db:migrate
   ```

   **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

5. **Start the Application**
   
   **Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will start on `http://localhost:3001`

   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will start on `http://localhost:3000`

## 📊 Core Features

### 🔐 Authentication System
- **JWT-based authentication** with access and refresh tokens
- **Role-based access control (RBAC)** with granular permissions
- **Protected routes** for all authenticated users
- **Token refresh system** for seamless user experience

**Default Roles:**
- **Super Admin**: Full system access
- **Admin**: Multi-branch management
- **Branch Manager**: Branch-specific operations
- **Operator**: Daily transaction operations

### 💰 Transaction Management
- **Inward Booking**: Money coming into the system
- **Outward Booking**: Money going out of the system
- **Auto Commission Calculation**: Configurable rates per city pair
- **Transaction Status Tracking**: Pending, Completed, Cancelled
- **Reference ID Management**: For external tracking
- **Multi-currency Support**: Indian Rupee formatting

### 📖 Accounting Module
- **Double Entry System**: Proper debit/credit accounting
- **Ledger Management**: Per user, branch, date range
- **Balance Tracking**: Real-time balance calculations
- **Trial Balance**: Automated generation
- **Account Reconciliation**: Built-in reconciliation tools

### 📈 Reports System
- **Inward Reports**: Detailed inward transaction analysis
- **Outward Reports**: Comprehensive outward transaction tracking
- **User Ledger Reports**: Individual user transaction history
- **Branch Performance**: Comparative branch analysis
- **Balance Summary**: Period-end financial statements
- **Export Functionality**: PDF and Excel export capabilities
- **Advanced Filtering**: Date range, city, party, status filters

### 📋 Balance Sheet
- **Double Entry Compliance**: Proper accounting standards
- **Asset Management**: Fixed and current assets tracking
- **Liability Tracking**: Comprehensive liability management
- **Equity Calculations**: Automated equity computations
- **Historical Snapshots**: Period-end closing balances
- **Running Totals**: Real-time balance calculations

### ⚙️ Master Data Management
- **User Management**: Create, edit, delete users with role assignment
- **Role Management**: Define permissions and access levels
- **City Management**: Geographic location setup
- **Party Management**: Client and vendor information
- **Branch Management**: Multi-branch operations support
- **Commission Rates**: Configurable rates per route
- **Audit Trail**: Complete change tracking

### 📊 Dashboard
- **Real-time Statistics**: Live transaction and financial metrics
- **Visual Analytics**: Charts and graphs for data visualization
- **Quick Actions**: One-click access to common tasks
- **Performance Metrics**: Branch and user performance tracking
- **Recent Activity**: Latest transactions and system events

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Security**: Secure token-based authentication
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Comprehensive data validation with Zod
- **SQL Injection Protection**: Prisma ORM security
- **CORS Configuration**: Proper cross-origin setup

### Data Protection
- **Input Sanitization**: All user inputs are sanitized
- **Password Security**: Bcrypt hashing for password storage
- **Session Management**: Secure session handling
- **Audit Logging**: Complete activity tracking

## 🎨 UI/UX Features

### Modern Design
- **Responsive Design**: Mobile and desktop optimized
- **Dark/Light Mode**: Theme switching support
- **Intuitive Navigation**: Sidebar-based navigation
- **Real-time Updates**: Live data synchronization
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages

### Accessibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels
- **High Contrast**: WCAG compliance
- **Focus Management**: Logical tab order

## 📱 Mobile Features

### Responsive Design
- **Mobile-First Design**: Optimized for mobile devices
- **Touch-Friendly**: Large touch targets
- **Offline Support**: Basic offline functionality
- **Progressive Enhancement**: Core features work without JavaScript

### Performance
- **Lazy Loading**: Optimized component loading
- **Image Optimization**: Responsive images
- **Bundle Size**: Optimized for fast loading
- **Caching Strategy**: Intelligent data caching

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/accounting_db"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Database Configuration
The application uses PostgreSQL with the following key features:
- **Decimal Precision**: All financial calculations use DECIMAL type
- **Indexing**: Optimized queries for date, branch, user
- **Soft Deletes**: Data integrity with audit trails
- **Foreign Keys**: Referential integrity
- **Constraints**: Data validation at database level

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout
POST /api/auth/refresh        # Token refresh
GET  /api/auth/profile        # User profile
```

### Transaction Endpoints
```
GET    /api/transactions           # List transactions
POST   /api/transactions           # Create transaction
GET    /api/transactions/:id       # Get transaction
PUT    /api/transactions/:id       # Update transaction
DELETE /api/transactions/:id       # Delete transaction
GET    /api/transactions/stats    # Transaction statistics
```

### Accounting Endpoints
```
GET    /api/accounting             # List ledger entries
POST   /api/accounting             # Create ledger entry
GET    /api/accounting/:id          # Get ledger entry
PUT    /api/accounting/:id          # Update ledger entry
DELETE /api/accounting/:id          # Delete ledger entry
GET    /api/accounting/balance     # Account balance
GET    /api/accounting/trial-balance # Trial balance
```

## 🚀 Deployment

### Development
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Production
```bash
# Build Frontend
cd frontend
npm run build

# Start Production
npm start
```

### Docker Deployment
```dockerfile
# Backend Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🧪 Testing

### Unit Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Integration Tests
```bash
# API integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 📈 Performance

### Database Optimization
- **Query Optimization**: Indexed queries for performance
- **Connection Pooling**: Efficient database connections
- **Caching Strategy**: Redis for frequently accessed data
- **Pagination**: Large dataset handling

### Frontend Optimization
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: WebP format with fallbacks
- **Bundle Analysis**: Regular performance monitoring
- **CDN Usage**: Static asset delivery

## 🔍 Monitoring & Logging

### Application Monitoring
- **Health Checks**: `/health` endpoint
- **Performance Metrics**: Response time tracking
- **Error Tracking**: Comprehensive error logging
- **User Analytics**: Usage pattern analysis

### Audit Trail
- **Complete Logging**: All data changes tracked
- **User Actions**: Login, create, update, delete operations
- **System Events**: Configuration changes, errors
- **Data Integrity**: Referential constraint violations

## 🔄 Backup & Recovery

### Database Backup
```bash
# Automated daily backups
npm run backup:database

# Manual backup
npm run backup:database:manual

# Restore database
npm run restore:database
```

### Data Export
- **Full Export**: Complete data export in multiple formats
- **Incremental Backup**: Regular incremental backups
- **Disaster Recovery**: Point-in-time recovery
- **Data Validation**: Backup integrity checks

## 🌐 Multi-Branch Support

### Branch Configuration
- **Independent Branches**: Each branch operates independently
- **Centralized Reporting**: Consolidated view across branches
- **User Assignment**: Users assigned to specific branches
- **Data Synchronization**: Real-time sync across branches

### Role-Based Access
- **Branch Managers**: Limited to their branch data
- **Cross-Branch Reports**: Admin-level reporting access
- **Data Isolation**: Secure data separation

## 📚 Documentation

### User Documentation
- **Product Walkthrough**: Step-by-step user guides
- **Feature Documentation**: Detailed feature explanations
- **API Documentation**: Complete API reference
- **Troubleshooting**: Common issues and solutions

### Developer Documentation
- **Architecture Overview**: System design and patterns
- **Database Schema**: Complete schema documentation
- **Deployment Guide**: Step-by-step deployment instructions
- **Contributing Guidelines**: Development standards

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict typing throughout
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent formatting
- **Conventional Commits**: Standardized commit messages

### Pull Request Process
- **Code Review**: All changes must be reviewed
- **Testing**: Tests must pass for merge
- **Documentation**: Update relevant documentation
- **Performance**: No performance regressions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check the `/help` page in the application
- **FAQ**: Common questions and answers
- **Contact**: Support contact information
- **Community**: Join our developer community

### Reporting Issues
- **Bug Reports**: Use the issue template
- **Feature Requests**: Follow the feature request format
- **Security Issues**: Report security vulnerabilities privately

---

## 🎯 Key Features Summary

✅ **Production-Ready**: Scalable architecture for high-volume transactions
✅ **Financial Accuracy**: Decimal precision, no rounding errors
✅ **Multi-Branch**: Support for multiple business locations
✅ **Role-Based Security**: Granular access control
✅ **Audit Trail**: Complete change tracking
✅ **Modern UI**: Responsive, accessible interface
✅ **Export Capabilities**: PDF/Excel reporting
✅ **Real-Time Updates**: Live data synchronization
✅ **Mobile Optimized**: Works on all devices
✅ **Secure**: Enterprise-grade security features

This application is designed specifically for Angadiya businesses that need reliable, scalable, and secure transaction management across multiple cities and branches in India.
