import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  // AttachMoney as MoneyIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Employee, NotificationItem } from '../types';

const DashboardPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    departments: 0,
    pendingOnboarding: 0,
  });
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load employee stats
      if (hasPermission('employees.view.all')) {
        const employeesResponse = await apiService.getEmployees();
        if (employeesResponse.success && employeesResponse.data) {
          const employees = employeesResponse.data as Employee[];
          setStats(prev => ({
            ...prev,
            totalEmployees: employees.length,
            activeEmployees: employees.filter((emp: Employee) => emp.status === 'Active').length,
            pendingOnboarding: employees.filter((emp: Employee) => emp.status === 'Pending Onboarding').length,
          }));

          // Get recent employees (last 5)
          const sortedEmployees = employees
            .sort((a: Employee, b: Employee) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime())
            .slice(0, 5);
          setRecentEmployees(sortedEmployees);
        }
      }

      // Load departments count
      if (hasPermission('employees.view.all')) {
        const departmentsResponse = await apiService.getDepartments();
        if (departmentsResponse.success && departmentsResponse.data) {
          const departments = departmentsResponse.data as any[];
          setStats(prev => ({
            ...prev,
            departments: departments.length,
          }));
        }
      }

      // Load notifications
      const notificationsResponse = await apiService.getNotifications();
      if (notificationsResponse.success && notificationsResponse.data) {
        const notifications = notificationsResponse.data as any[];
        setNotifications(notifications.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.firstName}!
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Here's what's happening in your organization today.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={<PeopleIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Employees"
            value={stats.activeEmployees}
            icon={<PeopleIcon />}
            color="#388e3c"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Departments"
            value={stats.departments}
            icon={<BusinessIcon />}
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Onboarding"
            value={stats.pendingOnboarding}
            icon={<AccessTimeIcon />}
            color="#d32f2f"
          />
        </Grid>

        {/* Recent Employees */}
        {hasPermission('employees.view.all') && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Hires
              </Typography>
              <List>
                {recentEmployees.map((employee, index) => (
                  <React.Fragment key={employee.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          {employee.firstName[0]}{employee.lastName[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${employee.firstName} ${employee.lastName}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {employee.position} • {employee.department}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Hired: {new Date(employee.hireDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label={employee.status}
                        color={employee.status === 'Active' ? 'success' : 'warning'}
                        size="small"
                      />
                    </ListItem>
                    {index < recentEmployees.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Notifications
            </Typography>
            <List>
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <NotificationsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={notification.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      {!notification.isRead && (
                        <Chip label="New" color="primary" size="small" />
                      )}
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No notifications"
                    secondary="You're all caught up!"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
