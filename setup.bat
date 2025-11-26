@echo off
echo 🚀 HRMS Application Setup Script
echo ================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js v16 or higher.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=2 delims=v." %%i in ('node --version') do set NODE_MAJOR=%%i
if %NODE_MAJOR% lss 16 (
    echo ❌ Node.js version 16 or higher is required. Current version:
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version

REM Check if PostgreSQL is accessible
psql --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  PostgreSQL client not found in PATH. Make sure PostgreSQL is installed.
) else (
    echo ✅ PostgreSQL client found
)

echo.
echo 📦 Installing dependencies...

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
if npm install (
    echo ✅ Backend dependencies installed
) else (
    echo ❌ Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ../frontend
if npm install (
    echo ✅ Frontend dependencies installed
) else (
    echo ❌ Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo 🔧 Setting up environment...

REM Check if .env exists in backend
if not exist "backend\.env" (
    if exist "backend\env.example" (
        copy backend\env.example backend\.env
        echo ✅ Created backend\.env from env.example
        echo ⚠️  Please edit backend\.env with your database credentials
    ) else (
        echo ⚠️  backend\env.example not found. Please create backend\.env manually
    )
) else (
    echo ✅ backend\.env already exists
)

echo.
echo 🎯 Next Steps:
echo ==============
echo.
echo 1. Set up PostgreSQL database:
echo    - Create database: hrms_db
echo    - Execute schema: backend\src\config\schema.sql
echo.
echo 2. Configure environment:
echo    - Edit backend\.env with your database URL
echo.
echo 3. Seed the database:
echo    cd backend ^& npm run seed
echo.
echo 4. Start the application:
echo    REM Terminal 1 - Backend
echo    cd backend ^& npm run dev
echo.
echo    REM Terminal 2 - Frontend
echo    cd frontend ^& npm start
echo.
echo 5. Access the application:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:3001
echo.
echo 6. Login credentials:
echo    - Email: sarah.johnson@techcorp.com
echo    - Password: Welcome@123
echo.
echo 🎉 Setup complete! Follow the steps above to run the application.

pause
