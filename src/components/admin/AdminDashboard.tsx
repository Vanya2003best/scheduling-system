import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  fetchMonthlyHours,
  selectMonthlyHours,
  selectAdminLoading,
  selectAdminError,
  selectAdminSuccessMessage,
  clearError,
  clearSuccessMessage
} from '../../store/slices/adminSlice';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Button, 
  Alert, 
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ScheduleGenerationPanel from './ScheduleGenerationPanel';
import StaffingRequirementsPanel from './StaffingRequirementsPanel';
import MonthlyHoursPanel from './MonthlyHoursPanel';
import EmployeeManagementPanel from './EmployeeManagementPanel';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const monthlyHours = useSelector(selectMonthlyHours);
  const isLoading = useSelector(selectAdminLoading);
  const error = useSelector(selectAdminError);
  const successMessage = useSelector(selectAdminSuccessMessage);

  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Load data for the dashboard
    dispatch(fetchMonthlyHours());
  }, [dispatch]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Admin Dashboard
        </Typography>
        
        <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
          Manage schedules, employees, and system settings
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => dispatch(clearError())}
          >
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            onClose={() => dispatch(clearSuccessMessage())}
          >
            {successMessage}
          </Alert>
        )}
        
        {isLoading && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        )}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="admin dashboard tabs"
            variant="fullWidth"
          >
            <Tab icon={<CalendarMonthIcon />} label="Schedule Generation" />
            <Tab icon={<SettingsIcon />} label="Staffing Requirements" />
            <Tab icon={<AssessmentIcon />} label="Monthly Hours" />
            <Tab icon={<PeopleIcon />} label="Employee Management" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <ScheduleGenerationPanel />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <StaffingRequirementsPanel />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <MonthlyHoursPanel monthlyHours={monthlyHours} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <EmployeeManagementPanel />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;