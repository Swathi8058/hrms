import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

const AddEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingManagers, setLoadingManagers] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    departmentId: '',
    position: '',
    roleId: '',
    hireDate: '',
    employmentType: 'Full-time',
    salary: '',
    status: 'Active',
    managerId: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    }
  });

  useEffect(() => {
    loadDepartments();
  }, []);

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
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        [name]: value
      }
    });
  };

  const handleSelectChange = (name: string) => (event: any) => {
    const value = event.target.value;
    const newFormData = {
      ...formData,
      [name]: value,
    };

    // Clear manager selection when department changes
    if (name === 'departmentId') {
      newFormData.managerId = '';
      loadManagers(value);
    }

    setFormData(newFormData);
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

  const shouldShowManagerDropdown = formData.departmentId && formData.position && !positionsWithoutManager.includes(formData.position);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate required fields
      const requiredFields = [
        'firstName', 'lastName', 'email', 'departmentId', 
        'position', 'hireDate', 'employmentType'
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      if (missingFields.length > 0) {
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      await apiService.createEmployee(formData);
      navigate('/employees');
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Failed to create employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('employees.create')) {
    return <div>Access denied</div>;
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Add New Employee
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
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
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
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
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
                  value={formData.departmentId}
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
                  value={formData.position}
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
                    value={formData.managerId}
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
                value={formData.hireDate}
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
                  value={formData.employmentType}
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
                value={formData.salary}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
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
                value={formData.address.street}
                onChange={handleAddressChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.address.city}
                onChange={handleAddressChange}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={formData.address.state}
                onChange={handleAddressChange}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="ZIP Code"
                name="zipCode"
                value={formData.address.zipCode}
                onChange={handleAddressChange}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Employee'}
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

export default AddEmployeePage;
