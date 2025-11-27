import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Employee } from '../types';

interface Department {
  id: string;
  name: string;
  description: string;
}

interface Manager {
  id: string;
  name: string;
  position: string;
  roleId: string;
}

const POSITIONS = [
  'CEO',
  'VP of Engineering',
  'VP of Product',
  'VP of Sales',
  'HR Director',
  'CFO',
  'Engineering Director',
  'HR Manager',
  'Payroll Manager',
  'Finance Manager',
  'Team Lead',
  'Developer',
  'Analyst',
  'Sales Associate',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'QA Engineer',
  'Product Manager',
  'Designer',
  'Marketing Specialist'
];

const EditEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const loadEmployee = useCallback(async () => {
    try {
      const response = await apiService.getEmployee(id!);
      if (response.success) {
        const employeeData = response.data as Employee;
        setEmployee(employeeData);

        // Load managers if employee has a department
        if (employeeData.departmentId) {
          loadManagers(employeeData.departmentId);
        }
      }
    } catch (error) {
      console.error('Error loading employee:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (id) {
      loadEmployee();
    }
  }, [id, loadEmployee]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await apiService.getOrgStructure();
      if (response.success && response.data) {
        const data = response.data as { departments: Department[] };
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadManagers = async (departmentId: string) => {
    if (!departmentId) {
      setManagers([]);
      return;
    }

    try {
      setLoadingManagers(true);
      const response = await apiService.getManagersByDepartment(departmentId);
      if (response.success && response.data) {
        setManagers(response.data as Manager[]);
      }
    } catch (error) {
      console.error('Error loading managers:', error);
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmployee(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmployee(prev => prev ? {
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    } : null);
  };

  const handleSelectChange = (name: string) => (event: any) => {
    const value = event.target.value;
    const newEmployee = employee ? { ...employee, [name]: value } : null;

    // Clear manager selection when department changes
    if (name === 'departmentId') {
      newEmployee!.managerId = '';
      loadManagers(value);
    }

    setEmployee(newEmployee);
  };

  // Positions that don't need managers (top-level positions)
  const positionsWithoutManager = [
    'CEO',
    'VP of Engineering',
    'VP of Product',
    'VP of Sales',
    'HR Director',
    'CFO'
  ];

  const shouldShowManagerDropdown = employee?.departmentId && employee?.position && !positionsWithoutManager.includes(employee.position);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setSaving(true);
    try {
      // Only send updatable fields
      const updateData = {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        dateOfBirth: employee.dateOfBirth,
        gender: employee.gender,
        address: employee.address,
        departmentId: employee.departmentId,
        position: employee.position,
        roleId: employee.role,
        managerId: employee.managerId,
        hireDate: employee.hireDate,
        employmentType: employee.employmentType,
        salary: employee.salary,
        status: employee.status,
      };

      await apiService.updateEmployee(id!, updateData);
      navigate('/employees');
    } catch (error) {
      console.error('Error updating employee:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission('employees.edit.all')) {
    return <div>Access denied</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!employee) {
    return <div>Employee not found</div>;
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Edit Employee
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={employee.firstName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={employee.lastName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={employee.email}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={employee.phone}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={employee.dateOfBirth}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={employee.gender}
                  onChange={handleSelectChange('gender')}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Employment Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Employment Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  name="departmentId"
                  value={employee.departmentId || ''}
                  onChange={handleSelectChange('departmentId')}
                  disabled={loadingDepartments}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Position</InputLabel>
                <Select
                  name="position"
                  value={employee.position}
                  onChange={handleSelectChange('position')}
                >
                  {POSITIONS.map((position) => (
                    <MenuItem key={position} value={position}>
                      {position}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {shouldShowManagerDropdown && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Manager</InputLabel>
                  <Select
                    name="managerId"
                    value={employee.managerId || ''}
                    onChange={handleSelectChange('managerId')}
                    disabled={loadingManagers}
                  >
                    <MenuItem value="">
                      <em>No Manager</em>
                    </MenuItem>
                    {managers.map((manager) => (
                      <MenuItem key={manager.id} value={manager.id}>
                        {manager.name} ({manager.position})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hire Date"
                name="hireDate"
                type="date"
                value={employee.hireDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  name="employmentType"
                  value={employee.employmentType}
                  onChange={handleSelectChange('employmentType')}
                >
                  <MenuItem value="Full-time">Full-time</MenuItem>
                  <MenuItem value="Part-time">Part-time</MenuItem>
                  <MenuItem value="Contract">Contract</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Salary"
                name="salary"
                type="number"
                value={employee.salary}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={employee.status}
                  onChange={handleSelectChange('status')}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Pending Onboarding">Pending Onboarding</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Address Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Address Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="street"
                value={employee.address.street}
                onChange={handleAddressChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={employee.address.city}
                onChange={handleAddressChange}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={employee.address.state}
                onChange={handleAddressChange}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="ZIP Code"
                name="zipCode"
                value={employee.address.zipCode}
                onChange={handleAddressChange}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/employees')}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditEmployeePage;
