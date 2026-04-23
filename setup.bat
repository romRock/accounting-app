@echo off
echo 🚀 Setting up Angadiya Accounting Application...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm from https://www.npmjs.com/
    pause
    exit /b 1
)

echo.
echo 📋 Installing dependencies...

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install

REM Install frontend dependencies
echo Installing frontend dependencies...
cd ..\frontend
call npm install

echo.
echo 🗄️ Setting up environment...

REM Setup backend environment
echo Setting up backend environment...
cd ..\backend
if not exist .env (
    copy .env.example .env
    echo ✅ Created .env file. Please update it with your database credentials:
    echo    DATABASE_URL=postgresql://username:password@localhost:5432/accounting_db
    echo    JWT_SECRET=your-super-secret-jwt-key
    echo    JWT_REFRESH_SECRET=your-super-secret-refresh-key
    echo    PORT=3001
    echo    NODE_ENV=development
    echo    FRONTEND_URL=http://localhost:3000
) else (
    echo ✅ Backend .env file already exists
)

REM Setup frontend environment
echo Setting up frontend environment...
cd ..\frontend
if not exist .env.local (
    copy .env.example .env.local
    echo ✅ Created frontend .env.local file with:
    echo    NEXT_PUBLIC_API_URL=http://localhost:3001
) else (
    echo ✅ Frontend .env.local file already exists
)

echo.
echo 🗄️ Database setup...

REM Generate Prisma client
echo Generating Prisma client...
cd ..\backend
call npm run db:generate

echo.
echo 🚀 Starting development servers...

REM Start both backend and frontend
echo Starting backend server...
cd ..\backend
start "Backend Server" cmd /k "npm run dev"

echo Starting frontend server...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Setup complete!
echo.
echo 🌐 Application URLs:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:3001
echo    API Health: http://localhost:3001/health
echo.
echo 📚 Useful commands:
echo    Stop servers: Close the command windows
echo    Database studio: cd backend && npm run db:studio
echo.
echo 🔧 Next steps:
echo    1. Update .env file with your database credentials
echo    2. Run database migrations: npm run db:migrate
echo    3. Create initial user and roles in database
echo    4. Access the application at http://localhost:3000
echo.
echo 📖 For help, run: setup.bat help
pause
