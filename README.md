# Human Resource Management System (HRMS)

A modern, role-based web application for managing human resources including employee onboarding, management, organizational structure, attendance tracking, and payroll processing.

## Features

### Core Modules

- **Onboarding**: End-to-end new hire onboarding workflow
- **Employee Management**: Centralized employee data & document management
- **Organizational Structure**: Interactive org chart & reporting chains
- **Attendance & Shift Management**: Clock-in/out, shift scheduling, regularization
- **Payroll Management**: Salary processing, payslip generation, disbursement

### Role-Based Access Control

- **Super Admin**: Full system access
- **HR Admin**: Complete HR operations access
- **Department Head**: Department-level management
- **Manager**: Team management access
- **HR Specialist**: Specialized HR functions
- **Finance Admin**: Finance and payroll management
- **Employee**: Self-service access

## Tech Stack

### Backend

- **Node.js** with TypeScript
- **Express.js** web framework
- **PostgreSQL** database
- **JWT** authentication
- **bcrypt** password hashing

### Frontend

- **React** with TypeScript
- **Material-UI** component library
- **React Router** for navigation
- **Axios** for API calls

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Git
- npm or yarn

## Git Setup

1. **Clone the repository:**

```bash
git clone <your-repo-url>
cd human-resource-management
```

2. **Initialize git (if not already done):**

```bash
git init
git add .
git commit -m "Initial commit: HRMS application"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

3. **Environment files are ignored** - Copy examples:

```bash
cp backend/env.example backend/.env
# Edit backend/.env with your database credentials
```

## Installation

### Quick Setup (Recommended)

**Linux/Mac users:**

```bash
chmod +x setup.sh
./setup.sh
```

**Windows users:**

```batch
# Double-click setup.bat or run in Command Prompt:
setup.bat
```

**Or follow the manual setup steps below.**

### Manual Setup

#### After Cloning

1. **Install dependencies:**

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Go back to root
cd ..
```

2. **Set up environment variables:**

```bash
# Copy environment example
cp backend/env.example backend/.env

# Edit backend/.env with your PostgreSQL credentials
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hrms_db
```

### Database Setup

1. Install PostgreSQL and create a database:

```sql
CREATE DATABASE hrms_db;
```

2. Update the database connection in `backend/.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/hrms_db
```

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables by copying the example file:

```bash
cp env.example .env
```

4. Update the `.env` file with your configuration.

5. Seed the database with sample data:

```bash
npm run seed
```

6. Start the development server:

```bash
npm run dev
```

The backend will be running on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The frontend will be running on `http://localhost:3000`

## Default Login Credentials

After seeding the database, you can log in with:

- **Email**: `sarah.johnson@techcorp.com`
- **Password**: `Welcome@123`

This account has Super Admin privileges.

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/change-password` - Change password

### Employee Endpoints

- `GET /api/employees` - Get all employees (with pagination and filtering)
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `GET /api/employees/:id/documents` - Get employee documents

## Project Structure

```
hrms/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Authentication and authorization
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── index.ts         # Application entry point
│   ├── uploads/             # File uploads directory
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── public/              # Static files
│   └── package.json
├── data/                    # Sample data files
└── README.md
```

## Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## File Structure & Git

### What's Included in Git

- ✅ **Source code** (TypeScript/React/Node.js)
- ✅ **Configuration files** (tsconfig.json, package.json)
- ✅ **Database schema** (schema.sql)
- ✅ **Documentation** (README.md)
- ✅ **Sample data scripts** (seed data)

### What's Ignored (Not in Git)

- ❌ **Dependencies** (`node_modules/`)
- ❌ **Environment files** (`.env`)
- ❌ **Build artifacts** (`dist/`, `build/`)
- ❌ **Logs** (`*.log`)
- ❌ **IDE files** (`.vscode/`, `.idea/`)
- ❌ **OS files** (`.DS_Store`, `Thumbs.db`)
- ❌ **Database files** (`*.db`, `*.sqlite`)

### Security Note

🔒 **Never commit `.env` files** - They contain sensitive information like database passwords and JWT secrets.

## Pushing to Git

The repository is ready for Git with a comprehensive `.gitignore` file that excludes:

- Dependencies (`node_modules/`)
- Environment files (`.env`)
- Build artifacts (`dist/`, `build/`)
- IDE files (`.vscode/`, `.idea/`)
- Logs and temporary files

### Initial Commit

```bash
git add .
git commit -m "feat: complete HRMS application with authentication, employee management, and org chart

- Backend: Node.js + TypeScript + PostgreSQL + JWT auth
- Frontend: React + TypeScript + Material-UI
- Features: Employee management, organizational chart, role-based access
- Database: Complete schema with sample data seeding"
git push origin main
```

### Repository Structure

```
hrms/
├── .gitignore          # Comprehensive ignore rules
├── setup.sh           # Linux/Mac setup script
├── setup.bat          # Windows setup script
├── README.md          # Complete documentation
├── backend/           # Node.js API server
├── frontend/          # React application
└── data/             # Sample data files
```

## License

This project is licensed under the ISC License.
