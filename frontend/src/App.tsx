import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import OrganizationPage from './pages/OrganizationPage';
import ProfilePage from './pages/ProfilePage';
import AddEmployeePage from './pages/AddEmployeePage';
import EditEmployeePage from './pages/EditEmployeePage';

// Route protection component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        {/* Placeholder routes - will be implemented */}
                        <Route path="/employees" element={<EmployeesPage />} />
                        <Route path="/employees/new" element={<AddEmployeePage />} />
                        <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
                        <Route path="/organization" element={<OrganizationPage />} />
                        <Route path="/departments" element={<div>Departments Page - Coming Soon</div>} />
                        <Route path="/attendance" element={<div>Attendance Page - Coming Soon</div>} />
                        <Route path="/payroll" element={<div>Payroll Page - Coming Soon</div>} />
                        <Route path="/profile" element={<ProfilePage />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
