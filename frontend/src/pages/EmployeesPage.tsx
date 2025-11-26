import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Box,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Employee } from '../types';
import { useNavigate } from 'react-router-dom';

interface EmployeeRow extends Employee {
  departmentName?: string;
  managerName?: string;
}

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuEmployee, setMenuEmployee] = useState<EmployeeRow | null>(null);

  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadEmployees();
  }, [page, rowsPerPage, search]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEmployees({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
      });

      if (response.success && response.data) {
        setEmployees(response.data as EmployeeRow[]);
        setTotal((response.data as any).pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, employee: EmployeeRow) => {
    setAnchorEl(event.currentTarget);
    setMenuEmployee(employee);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuEmployee(null);
  };

  const handleViewDetails = (employee: EmployeeRow) => {
    setSelectedEmployee(employee);
    setDetailsOpen(true);
    handleMenuClose();
  };

  const handleEditEmployee = (employee: EmployeeRow) => {
    navigate(`/employees/${employee.id}/edit`);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'error';
      case 'Pending Onboarding':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Employees</Typography>
          {hasPermission('employees.create') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/employees/new')}
            >
              Add Employee
            </Button>
          )}
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search employees..."
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Hire Date</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          {employee.firstName[0]}{employee.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            {employee.firstName} {employee.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {employee.employeeId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status}
                        color={getStatusColor(employee.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(employee.hireDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{employee.managerName || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, employee)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuEmployee && handleViewDetails(menuEmployee)}>
          <VisibilityIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {hasPermission('employees.edit.all') && (
          <MenuItem onClick={() => menuEmployee && handleEditEmployee(menuEmployee!)}>
            <EditIcon sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
      </Menu>

      {/* Employee Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedEmployee && `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Typography><strong>Employee ID:</strong> {selectedEmployee.employeeId}</Typography>
                    <Typography><strong>Email:</strong> {selectedEmployee.email}</Typography>
                    <Typography><strong>Phone:</strong> {selectedEmployee.phone}</Typography>
                    <Typography><strong>Department:</strong> {selectedEmployee.department}</Typography>
                    <Typography><strong>Position:</strong> {selectedEmployee.position}</Typography>
                    <Typography><strong>Employment Type:</strong> {selectedEmployee.employmentType}</Typography>
                    <Typography><strong>Hire Date:</strong> {new Date(selectedEmployee.hireDate).toLocaleDateString()}</Typography>
                    <Typography><strong>Status:</strong> {selectedEmployee.status}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Personal Information
                    </Typography>
                    <Typography><strong>Date of Birth:</strong> {selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString() : 'N/A'}</Typography>
                    <Typography><strong>Gender:</strong> {selectedEmployee.gender}</Typography>
                    <Typography><strong>Address:</strong></Typography>
                    {selectedEmployee.address && (
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body2">{selectedEmployee.address.street}</Typography>
                        <Typography variant="body2">
                          {selectedEmployee.address.city}, {selectedEmployee.address.state} {selectedEmployee.address.zipCode}
                        </Typography>
                        <Typography variant="body2">{selectedEmployee.address.country}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {hasPermission('employees.edit.all') && selectedEmployee && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailsOpen(false);
                handleEditEmployee(selectedEmployee);
              }}
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployeesPage;
