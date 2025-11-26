import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  Button,
  // Divider,
  Alert,
  Chip,
  // List,
  // ListItem,
  // ListItemText,
  // IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  // Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Employee } from '../types';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEmployeeProfile();
      if (response.success && response.data) {
        setEmployee(response.data as Employee);
        setFormData(response.data as Employee);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setError('');
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData(employee || {});
    setError('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const response = await apiService.updateEmployeeProfile(formData);
      if (response.success && response.data) {
        setEmployee(response.data as Employee);
        setEditing(false);
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...(prev.address || {}),
        [field]: value,
      } as any,
    }));
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Typography>Loading profile...</Typography>
      </Container>
    );
  }

  if (!employee) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">Failed to load profile</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <Avatar
              sx={{ width: 80, height: 80, mr: 3 }}
              src={undefined} // Add profile picture support later
            >
              {employee.firstName[0]}{employee.lastName[0]}
            </Avatar>
            <Box>
              <Typography variant="h4">
                {employee.firstName} {employee.lastName}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {employee.position} • {employee.department}
              </Typography>
              <Chip
                label={employee.status}
                color={employee.status === 'Active' ? 'success' : 'warning'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
          {!editing && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit Profile
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Basic Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editing ? formData.firstName || '' : employee.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!editing}
                  InputProps={{ readOnly: !editing }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editing ? formData.lastName || '' : employee.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!editing}
                  InputProps={{ readOnly: !editing }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={employee.email}
                  disabled
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={editing ? formData.phone || '' : employee.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!editing}
                  InputProps={{ readOnly: !editing }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  value={employee.employeeId}
                  disabled
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hire Date"
                  value={new Date(employee.hireDate).toLocaleDateString()}
                  disabled
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Address */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Address
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={editing ? formData.address?.street || '' : employee.address?.street || ''}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  disabled={!editing}
                  InputProps={{ readOnly: !editing }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={editing ? formData.address?.city || '' : employee.address?.city || ''}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  disabled={!editing}
                  InputProps={{ readOnly: !editing }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="State"
                  value={editing ? formData.address?.state || '' : employee.address?.state || ''}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  disabled={!editing}
                  InputProps={{ readOnly: !editing }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={editing ? formData.address?.zipCode || '' : employee.address?.zipCode || ''}
                  onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                  disabled={!editing}
                  InputProps={{ readOnly: !editing }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Emergency Contact
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Name"
                  value={editing ? formData.emergencyContact?.name || '' : employee.emergencyContact?.name || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emergencyContact: {
                      ...(prev.emergencyContact || {}),
                      name: e.target.value,
                    } as any,
                  }))}
                  disabled={!editing}
                  InputProps={{ readOnly: !editing }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Relationship"
                  value={editing ? formData.emergencyContact?.relationship || '' : employee.emergencyContact?.relationship || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emergencyContact: {
                      ...(prev.emergencyContact || {}),
                      relationship: e.target.value,
                    } as any,
                  }))}
                  disabled={!editing}
                  InputProps={{ readOnly: !editing }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={editing ? formData.emergencyContact?.phone || '' : employee.emergencyContact?.phone || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emergencyContact: {
                      ...(prev.emergencyContact || {}),
                      phone: e.target.value,
                    } as any,
                  }))}
                  disabled={!editing}
                  InputProps={{ readOnly: !editing }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Skills
            </Typography>
            <Box>
              {(employee.skills || []).map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  sx={{ mr: 1, mb: 1 }}
                  onDelete={editing ? () => {
                    const newSkills = [...(formData.skills || [])];
                    newSkills.splice(index, 1);
                    handleInputChange('skills', newSkills);
                  } : undefined}
                />
              ))}
              {editing && (
                <TextField
                  placeholder="Add a skill"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const newSkill = (e.target as HTMLInputElement).value.trim();
                      if (newSkill) {
                        const newSkills = [...(formData.skills || []), newSkill];
                        handleInputChange('skills', newSkills);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {editing && (
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ProfilePage;
