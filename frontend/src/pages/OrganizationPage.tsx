import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  // Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountTree as TreeIcon,
  List as ListIcon,
  Business as DepartmentIcon,
  Person as PersonIcon,
  // ExpandMore as ExpandMoreIcon,
  // ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import OrgChart from '../components/OrgChart';

interface OrgEmployee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  role_id: string;
  department_name: string;
  manager_id?: string;
  status: string;
  children?: OrgEmployee[];
}

interface Department {
  id: string;
  name: string;
  description: string;
  head_role: string;
  location: string;
  functions: string[];
  sub_departments?: any[];
  head_first_name?: string;
  head_last_name?: string;
  head_employee_id?: string;
}

interface ReportingChain {
  employeeId: string;
  upward: Array<{
    id: string;
    name: string;
    position: string;
    department: string;
    role: string;
  }>;
  downward: Array<{
    id: string;
    name: string;
    position: string;
    department: string;
    role: string;
    managerId: string;
  }>;
}

const OrganizationPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [orgData, setOrgData] = useState<{
    hierarchy: OrgEmployee[];
    departments: Department[];
    employees: OrgEmployee[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<OrgEmployee | null>(null);
  const [reportingChain, setReportingChain] = useState<ReportingChain | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [chainOpen, setChainOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentOpen, setDepartmentOpen] = useState(false);

  const { hasPermission } = useAuth();

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrgStructure();
      if (response.success && response.data) {
        setOrgData(response.data as any);
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await apiService.searchEmployees({ q: searchQuery });
      if (response.success && response.data) {
        setSearchResults(response.data as any[]);
      }
    } catch (error) {
      console.error('Error searching employees:', error);
    }
  };

  const handleEmployeeClick = async (employee: OrgEmployee) => {
    setSelectedEmployee(employee);

    // Load reporting chain
    try {
      const chainResponse = await apiService.getReportingChain(employee.id);
      if (chainResponse.success && chainResponse.data) {
        setReportingChain(chainResponse.data as ReportingChain);
      }
    } catch (error) {
      console.error('Error loading reporting chain:', error);
    }

    setDetailsOpen(true);
  };

  const handleViewReportingChain = () => {
    setDetailsOpen(false);
    setChainOpen(true);
  };

  const handleDepartmentClick = async (department: Department) => {
    try {
      const response = await apiService.getDepartmentDetails(department.id);
      if (response.success && response.data) {
        const data = response.data as any;
        setSelectedDepartment({
          ...department,
          ...data.department,
          employees: data.employees,
        });
        setDepartmentOpen(true);
      }
    } catch (error) {
      console.error('Error loading department details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Pending Onboarding':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Organizational Structure
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          View and explore the company hierarchy and reporting relationships
        </Typography>
      </Box>

      {/* Search and View Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search employees by name or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
            >
              Search
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Tabs
              value={viewMode}
              onChange={(_, newValue) => setViewMode(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                icon={<TreeIcon />}
                label="Chart View"
                value="chart"
                iconPosition="start"
              />
              <Tab
                icon={<ListIcon />}
                label="List View"
                value="list"
                iconPosition="start"
              />
            </Tabs>
          </Grid>
        </Grid>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Search Results ({searchResults.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((employee) => (
                    <TableRow
                      key={employee.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                            {employee.first_name[0]}{employee.last_name[0]}
                          </Avatar>
                          {employee.first_name} {employee.last_name}
                        </Box>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.department_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={employee.status}
                          color={getStatusColor(employee.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Departments Overview */}
      {orgData?.departments && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Departments
          </Typography>
          <Grid container spacing={2}>
            {orgData.departments.map((dept) => (
              <Grid item xs={12} sm={6} md={4} key={dept.id}>
                <Card
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleDepartmentClick(dept)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <DepartmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">{dept.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {dept.description}
                    </Typography>
                    {dept.head_first_name && (
                      <Typography variant="body2">
                        Head: {dept.head_first_name} {dept.head_last_name}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Location: {dept.location}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Main Content */}
      {viewMode === 'chart' ? (
        <Paper sx={{ p: 3, minHeight: 600 }}>
          <Typography variant="h6" gutterBottom>
            Organization Chart
          </Typography>
          <OrgChart
            data={orgData?.hierarchy || []}
            onEmployeeClick={handleEmployeeClick}
            loading={loading}
          />
        </Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Employee List
          </Typography>
          {orgData?.employees && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Manager</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orgData.employees.map((employee) => (
                    <TableRow
                      key={employee.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                            {employee.first_name[0]}{employee.last_name[0]}
                          </Avatar>
                          {employee.first_name} {employee.last_name}
                        </Box>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.department_name}</TableCell>
                      <TableCell>
                        {employee.manager_id ? 'Has Manager' : 'Top Level'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={employee.status}
                          color={getStatusColor(employee.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Employee Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedEmployee && `${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Employee Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Employee ID:</strong> {selectedEmployee.employee_id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Position:</strong> {selectedEmployee.position}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Department:</strong> {selectedEmployee.department_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Role:</strong> {selectedEmployee.role_id}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Chip
                    label={selectedEmployee.status}
                    color={getStatusColor(selectedEmployee.status)}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {reportingChain && (
            <Button variant="contained" onClick={handleViewReportingChain}>
              View Reporting Chain
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Reporting Chain Dialog */}
      <Dialog
        open={chainOpen}
        onClose={() => setChainOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Reporting Chain - {selectedEmployee?.first_name} {selectedEmployee?.last_name}
        </DialogTitle>
        <DialogContent>
          {reportingChain && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Reports To (Upward)
                </Typography>
                <List>
                  {reportingChain.upward.map((person, index) => (
                    <React.Fragment key={person.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={person.name}
                          secondary={`${person.position} • ${person.department}`}
                        />
                      </ListItem>
                      {index < reportingChain.upward.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Direct Reports (Downward)
                </Typography>
                <List>
                  {reportingChain.downward.length > 0 ? (
                    reportingChain.downward.map((person) => (
                      <ListItem key={person.id}>
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={person.name}
                          secondary={`${person.position} • ${person.department}`}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No direct reports" />
                    </ListItem>
                  )}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChainOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Department Details Dialog */}
      <Dialog
        open={departmentOpen}
        onClose={() => setDepartmentOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedDepartment?.name}
        </DialogTitle>
        <DialogContent>
          {selectedDepartment && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedDepartment.description}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Head:</strong> {selectedDepartment.head_first_name} {selectedDepartment.head_last_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Location:</strong> {selectedDepartment.location}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Functions
              </Typography>
              <Box sx={{ mb: 3 }}>
                {selectedDepartment.functions.map((func, index) => (
                  <Chip key={index} label={func} sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>
                Team Members ({(selectedDepartment as any).employees?.length || 0})
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Manager</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedDepartment as any).employees?.map((emp: any) => (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                              {emp.first_name[0]}{emp.last_name[0]}
                            </Avatar>
                            {emp.first_name} {emp.last_name}
                          </Box>
                        </TableCell>
                        <TableCell>{emp.position}</TableCell>
                        <TableCell>
                          {emp.manager_first_name
                            ? `${emp.manager_first_name} ${emp.manager_last_name}`
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emp.status}
                            color={getStatusColor(emp.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepartmentOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrganizationPage;

