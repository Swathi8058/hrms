import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Collapse,
  Chip,
  // Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  // Business as DepartmentIcon,
  // Person as PersonIcon,
} from '@mui/icons-material';

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

interface OrgChartNodeProps {
  employee: OrgEmployee;
  level: number;
  onEmployeeClick: (employee: OrgEmployee) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (employeeId: string) => void;
}

interface OrgChartProps {
  data: OrgEmployee[];
  onEmployeeClick: (employee: OrgEmployee) => void;
  loading?: boolean;
}

const OrgChart: React.FC<OrgChartProps> = ({ data, onEmployeeClick, loading = false }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleToggleExpand = useCallback((employeeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  }, []);

  // Internal component for rendering nodes
  const OrgChartNodeComponent: React.FC<OrgChartNodeProps> = ({
    employee,
    level,
    onEmployeeClick,
    expandedNodes,
    onToggleExpand,
  }) => {
    const hasChildren = employee.children && employee.children.length > 0;
    const isExpanded = expandedNodes.has(employee.id);

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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Employee Card */}
        <Paper
          elevation={level === 0 ? 4 : 2}
          sx={{
            p: 2,
            minWidth: 200,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: level === 0 ? '2px solid #1976d2' : '1px solid #e0e0e0',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 6,
            },
          }}
          onClick={() => onEmployeeClick(employee)}
        >
          <Box display="flex" alignItems="center" flexDirection="column" textAlign="center">
            <Avatar
              sx={{
                width: level === 0 ? 60 : 50,
                height: level === 0 ? 60 : 50,
                mb: 1,
                bgcolor: level === 0 ? 'primary.main' : 'secondary.main',
              }}
            >
              {employee.first_name[0]}{employee.last_name[0]}
            </Avatar>

            <Typography variant={level === 0 ? 'h6' : 'subtitle2'} gutterBottom>
              {employee.first_name} {employee.last_name}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {employee.position}
            </Typography>

            <Box sx={{ mb: 1 }}>
              <Chip
                label={employee.department_name}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            </Box>

            <Chip
              label={employee.status}
              color={getStatusColor(employee.status)}
              size="small"
            />

            {hasChildren && (
              <IconButton
                size="small"
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.stopPropagation();
                  onToggleExpand(employee.id);
                }}
                sx={{ mt: 1 }}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Box>
        </Paper>

        {/* Connector Line */}
        {hasChildren && (
          <Box
            sx={{
              width: 2,
              height: 30,
              bgcolor: 'grey.300',
              mt: 1,
              mb: 1,
            }}
          />
        )}

        {/* Children */}
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 2,
                mt: 2,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -15,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '100%',
                  height: 2,
                  bgcolor: 'grey.300',
                },
              }}
            >
              {employee.children!.map((child: OrgEmployee) => (
                <OrgChartNodeComponent
                  key={child.id}
                  employee={child}
                  level={level + 1}
                  onEmployeeClick={onEmployeeClick}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                />
              ))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Typography variant="h6" color="text.secondary">
          No organizational data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 4,
        p: 2,
        minHeight: 400,
        overflow: 'auto',
      }}
    >
      {data.map((rootEmployee: OrgEmployee) => (
        <OrgChartNodeComponent
          key={rootEmployee.id}
          employee={rootEmployee}
          level={0}
          onEmployeeClick={onEmployeeClick}
          expandedNodes={expandedNodes}
          onToggleExpand={handleToggleExpand}
        />
      ))}
    </Box>
  );
};

export default OrgChart;
