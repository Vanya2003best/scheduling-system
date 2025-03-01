import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  addExactDatePreference,
  removeExactDatePreference,
  selectCurrentPreference,
  MonthOption,
  ExactDatePreference as ExactDatePreferenceType
} from '../../store/slices/preferenceSlice';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  FormHelperText,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatDateWithDayOfWeek, getDatesInMonth, formatDate } from '../../utils/dateUtils';
import { TIME_RANGES } from '../../utils/constants';

interface ExactDatePreferencesProps {
  month: MonthOption;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

const ExactDatePreferences: React.FC<ExactDatePreferencesProps> = ({ 
  month, 
  onBack, 
  onNext,
  isLoading
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentPreference = useSelector(selectCurrentPreference);
  
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

  // Calculate available dates for the selected month
  const availableDates = getDatesInMonth(month.year, month.monthNumber);
  
  // Validation function for the form
  const validateForm = (): boolean => {
    if (!date) {
      setError('Please select a date');
      return false;
    }
    
    if (!startTime) {
      setError('Please select a start time');
      return false;
    }
    
    if (!endTime) {
      setError('Please select an end time');
      return false;
    }
    
    // Ensure end time is after start time (unless it's a shift crossing midnight)
    if (startTime >= endTime && endTime !== '00:00') {
      setError('End time must be after start time (unless it\'s a midnight shift)');
      return false;
    }
    
    // Check if the date already has a fixed preference
    if (currentPreference?.exactDatePreferences.some(pref => pref.exactDate === date)) {
      setError('You already have a fixed preference for this date');
      return false;
    }
    
    setError('');
    return true;
  };

  // Handle adding a new fixed date preference
  const handleAddPreference = () => {
    if (!validateForm()) return;
    
    dispatch(addExactDatePreference({
      exactDate: date,
      startTime,
      endTime
    }));
    
    // Reset form
    setDate('');
    setStartTime('');
    setEndTime('');
  };

  // Handle removing a fixed date preference
  const handleRemovePreference = (index: number) => {
    dispatch(removeExactDatePreference(index));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Add Fixed Date and Time Preferences
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Fixed preferences cannot be adjusted by the scheduling system. Use these for days and times when you absolutely must work a specific shift.
      </Alert>
      
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Add New Fixed Preference
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isLoading}
              InputProps={{
                inputProps: {
                  min: formatDate(availableDates[0]),
                  max: formatDate(availableDates[availableDates.length - 1])
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isLoading}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isLoading}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              fullWidth
              variant="contained" 
              color="secondary" 
              onClick={handleAddPreference}
              disabled={isLoading}
            >
              Add
            </Button>
          </Grid>
        </Grid>
        
        {error && (
          <FormHelperText error>{error}</FormHelperText>
        )}
      </Paper>
      
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ p: 2, pb: 0 }}>
          Your Fixed Preferences
        </Typography>
        
        {currentPreference && currentPreference.exactDatePreferences.length > 0 ? (
          <List>
            {currentPreference.exactDatePreferences.map((preference, index) => (
              <React.Fragment key={index}>
                <ListItem
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      onClick={() => handleRemovePreference(index)}
                      disabled={isLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={formatDateWithDayOfWeek(new Date(preference.exactDate))}
                    secondary={`${preference.startTime} - ${preference.endTime}`}
                  />
                </ListItem>
                {index < currentPreference.exactDatePreferences.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
            No fixed preferences added yet.
          </Typography>
        )}
      </Paper>

      <Box display="flex" justifyContent="space-between" mt={2}>
        <Button onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onNext}
          disabled={isLoading}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default ExactDatePreferences;