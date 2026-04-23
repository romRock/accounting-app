#!/bin/bash

echo "🚀 Setting up Angadiya Accounting Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm from https://www.npmjs.com/"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "⚠️  PostgreSQL is not running. Please start PostgreSQL service."
fi

echo ""
echo "📋 Installing dependencies..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "🗄️ Setting up environment..."

# Setup backend environment
echo "Setting up backend environment..."
cd ../backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your database credentials:"
    echo "   DATABASE_URL=postgresql://username:password@localhost:5432/accounting_db"
    echo "   JWT_SECRET=your-super-secret-jwt-key"
    echo "   JWT_REFRESH_SECRET=your-super-secret-refresh-key"
    echo "   PORT=3001"
    echo "   NODE_ENV=development"
    echo "   FRONTEND_URL=http://localhost:3000"
else
    echo "✅ Backend .env file already exists"
fi

# Setup frontend environment
echo "Setting up frontend environment..."
cd ../frontend
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created frontend .env.local file with:"
    echo "   NEXT_PUBLIC_API_URL=http://localhost:3001"
else
    echo "✅ Frontend .env.local file already exists"
fi

echo ""
echo "🗄️ Database setup..."

# Check if database exists
cd ../backend
if npm run db:push --accept-data-loss 2>/dev/null; then
    echo "✅ Database schema pushed successfully"
else
    echo "⚠️  Database push failed. Please check your database connection."
fi

# Generate Prisma client
echo "Generating Prisma client..."
cd ../backend
npm run db:generate

echo ""
echo "🚀 Starting development servers..."

# Start both backend and frontend in background
echo "Starting backend server..."
cd ../backend
npm run dev &
BACKEND_PID=$!

echo "Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   API Health: http://localhost:3001/health"
echo ""
echo "📚 Useful commands:"
echo "   Stop servers: kill $BACKEND_PID $FRONTEND_PID"
echo "   View logs: tail -f backend/logs/*.log"
echo "   Database studio: cd backend && npm run db:studio"
echo ""
echo "🔧 Next steps:"
echo "   1. Update .env file with your database credentials"
echo "   2. Run database migrations: npm run db:migrate"
echo "   3. Create initial user and roles in the database"
echo "   4. Access the application at http://localhost:3000"
echo ""
echo "📖 For help, run: ./setup.sh help"
echo ""

# Function to stop servers
stop_servers() {
    echo "🛑 Stopping development servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo "✅ Servers stopped"
}

# Handle script arguments
case "$1" in
    "stop")
        stop_servers
        ;;
    "help")
        echo "📖 Angadiya Accounting Setup Help"
        echo ""
        echo "Usage: ./setup.sh [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  - Run complete setup"
        echo "  stop       - Stop development servers"
        echo "  help       - Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./setup.sh           # Initial setup"
        echo "  ./setup.sh stop       # Stop servers"
        echo "  ./setup.sh help       # Show help"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run './setup.sh help' for available commands"
        exit 1
        ;;
esac

# Trap to clean up background processes on exit
trap 'echo "🧹 Cleaning up..."; stop_servers' EXIT
