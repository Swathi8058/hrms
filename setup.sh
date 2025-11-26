#!/bin/bash

echo "🚀 HRMS Application Setup Script"
echo "================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if PostgreSQL is accessible (basic check)
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
else
    echo "⚠️  PostgreSQL client not found in PATH. Make sure PostgreSQL is installed."
fi

echo ""
echo "📦 Installing dependencies..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
if npm install; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd ..

echo ""
echo "🔧 Setting up environment..."

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
        echo "✅ Created backend/.env from env.example"
        echo "⚠️  Please edit backend/.env with your database credentials"
    else
        echo "⚠️  backend/env.example not found. Please create backend/.env manually"
    fi
else
    echo "✅ backend/.env already exists"
fi

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo ""
echo "1. Set up PostgreSQL database:"
echo "   - Create database: hrms_db"
echo "   - Execute schema: backend/src/config/schema.sql"
echo ""
echo "2. Configure environment:"
echo "   - Edit backend/.env with your database URL"
echo ""
echo "3. Seed the database:"
echo "   cd backend && npm run seed"
echo ""
echo "4. Start the application:"
echo "   # Terminal 1 - Backend"
echo "   cd backend && npm run dev"
echo "   "
echo "   # Terminal 2 - Frontend"
echo "   cd frontend && npm start"
echo ""
echo "5. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo ""
echo "6. Login credentials:"
echo "   - Email: sarah.johnson@techcorp.com"
echo "   - Password: Welcome@123"
echo ""
echo "🎉 Setup complete! Follow the steps above to run the application."
