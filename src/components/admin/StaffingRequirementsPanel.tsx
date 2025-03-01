import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  fetchStaffingRequirements,
  updateStaffingRequirements,
  selectStaffingRequirements,
  selectAdminLoading,
  StaffingRequirement
} from '../../store/slices/adminSlice';
import { 
  Box, 
  Typography, 
  Grid, 
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import InfoIcon from '@mui/icons-material/Info';
import { DAYS_OF_WEEK } from '../../utils/constants';

const StaffingRequirementsPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const originalRequirements = useSelector(selectStaffingRequirements);
  const isLoading = useSelector(selectAdminLoading);
  
  const [requirements, setRequirements] = useState<StaffingRequirement[]>([]);
  const [formattedRequirements, setFormattedRequirements] = useState<Record<string, Record<string, number>>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Hours for which we need staffing
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  
  // Load staffing requirements on component mount
  useEffect(() => {
    dispatch(fetchStaffingRequirements());
  }, [dispatch]);
  
  // Format requirements for easier editing in the table
  useEffect(() => {
    if (originalRequirements.length > 0) {
      setRequirements([...originalRequirements]);
      
      const formatted: Record<string, Record<string, number>> = {};
      
      // Initialize with all days and hours set to 0
      DAYS_OF_WEEK.forEach(day => {
        formatted[day.value] = {};
        hours.forEach(hour => {
          formatted[day.value][hour] = 0;
        });
      });
      
      // Fill in values from requirements
      originalRequirements.forEach(req => {
        if (formatted[req.dayOfWeek] && hours.includes(req.hourOfDay)) {
          formatted[req.dayOfWeek][req.hourOfDay] = req.requiredEmployees;
        }
      });
      
      setFormattedRequirements(formatted);
      setHasChanges(false);
    }
  }, [originalRequirements]);
  
  const handleRequirementChange = (day: string, hour: string, value: number) => {
    const newValue = Math.max(0, value); // Ensure value is not negative
    
    setFormattedRequirements(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [hour]: newValue
      }
    }));
    
    setHasChanges(true);
  };
  
  const handleSaveRequirements = () => {
    // Convert formatted requirements back to array
    const updatedRequirements: StaffingRequirement[] = [];
    
    Object.entries(formattedRequirements).forEach(([dayOfWeek, hourValues]) => {
      Object.entries(hourValues).forEach(([hourOfDay, requiredEmployees]) => {
        const existingReq = requirements.find(
          r => r.dayOfWeek === dayOfWeek && r.hourOfDay === hourOfDay
        );
        
        updatedRequirements.push({
          id: existingReq?.id || 0, // Use existing ID if available
          dayOfWeek,
          hourOfDay,
          requiredEmployees
        });
      });
    });
    
    dispatch(updateStaffingRequirements(updatedRequirements));
  };
  
  const handleReset = () => {
    // Reset to original values
    if (originalRequirements.length > 0) {
      const formatted: Record<string, Record<string, number>> = {};
      
      // Initialize with all days and hours set to 0
      DAYS_OF_WEEK.forEach(day => {
        formatted[day.value] = {};
        hours.forEach(hour => {
          formatted[day.value][hour] = 0;
        });
      });
      
      // Fill in values from original requirements
      originalRequirements.forEach(req => {
        if (formatted[req.dayOfWeek] && hours.includes(req.hourOfDay)) {
          formatted[req.dayOfWeek][req.hourOfDay] = req.requiredEmployees;
        }
      });
      
      setFormattedRequirements(formatted);
      setHasChanges(false);
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Staffing Requirements
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            onClick={handleReset}
            disabled={!hasChanges || isLoading}
            startIcon={<RestartAltIcon />}
            sx={{ mr: 1 }}
          >
            Reset
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveRequirements}
            disabled={!hasChanges || isLoading}
            startIcon={<SaveIcon />}
          >
            Save Changes
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="textSecondary">
          Set the required number of employees for each day and hour. These values will be used by the scheduling algorithm to determine staffing levels.
        </Typography>
        <Tooltip title="Enter 0 if no employees are required for a particular hour">
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {hasChanges && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have unsaved changes. Click "Save Changes" to apply them.
        </Alert>
      )}
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
              <TableCell>Day / Hour</TableCell>
              {hours.map(hour => (
                <TableCell key={hour} align="center" sx={{ minWidth: 60 }}>
                  {hour}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {DAYS_OF_WEEK.map(day => (
              <TableRow key={day.value}>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {day.label}
                </TableCell>
                {hours.map(hour => (
                  <TableCell key={`${day.value}-${hour}`} align="center">
                    <TextField
                      type="number"
                      size="small"
                      inputProps={{ 
                        min: 0, 
                        style: { textAlign: 'center', padding: '4px' } 
                      }}
                      value={formattedRequirements[day.value]?.[hour] || 0}
                      onChange={(e) => handleRequirementChange(
                        day.value, 
                        hour, 
                        parseInt(e.target.value) || 0
                      )}
                      disabled={isLoading}
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StaffingRequirementsPanel;