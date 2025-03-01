import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  submitPreference,
  updatePreference,
  selectCurrentPreference,
  MonthOption
} from '../../store/slices/preferenceSlice';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import { formatDateWithDayOfWeek } from '../../utils/dateUtils';
import { DAYS_OF_WEEK, getShiftByValue } from '../../utils/constants';

interface PreferenceReviewProps {
  month: MonthOption;
  onBack: () => void;
  onReset: () => void;
  isLoading: boolean;
}

const PreferenceReview: React.FC<PreferenceReviewProps> = ({ 
  month, 
  onBack, 
  onReset,
  isLoading
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentPreference = useSelector(selectCurrentPreference);
  const [weekdayHours, setWeekdayHours] = useState(0);
  const [fixedHours, setFixedHours] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  
  // Calculate hours when preferences change
  useEffect(() => {
    if (!currentPreference) return;
    
    let weekdayTotal = 0;
    let fixedTotal = 0;
    
    // Calculate weekday preference hours (rough estimate based on typical shifts)
    currentPreference.weekdayPreferences.forEach(pref => {
      if (pref.shiftPreference) {
        const shift = getShiftByValue(pref.shiftPreference);
        if (shift && shift.startTime && shift.endTime) {
          // Estimate 4 occurrences of each weekday in a month
          const shiftDuration = calculateShiftDuration(shift.startTime, shift.endTime);
          weekdayTotal += shiftDuration * 4; // Multiply by average weeks in month
        }
      }
    });
    
    // Calculate fixed preference hours
    currentPreference.exactDatePreferences.forEach(pref => {
      const duration = calculateShiftDuration(pref.startTime, pref.endTime);
      fixedTotal += duration;
    });
    
    setWeekdayHours(Math.round(weekdayTotal));
    setFixedHours(Math.round(fixedTotal));
    setTotalHours(Math.round(weekdayTotal + fixedTotal));
  }, [currentPreference]);
  
  // Calculate shift duration
  const calculateShiftDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let duration = (endHour - startHour) + (endMinute - startMinute) / 60;
    
    // If negative, the shift crosses midnight
    if (duration < 0) {
      duration += 24;
    }
    
    return duration;
  };

  // Handle submitting preferences
  const handleSubmit = () => {
    if (!currentPreference) return;
    
    const preference = {
      ...currentPreference,
      targetMonth: month.monthName,
      targetYear: month.year
    };
    
    if (currentPreference.id) {
      dispatch(updatePreference({
        monthId: month.id.toString(),
        preference
      }));
    } else {
      dispatch(submitPreference({
        monthId: month.id.toString(),
        preference
      }));
    }
  };

  if (!currentPreference) {
    return <Alert severity="warning">No preference data available for review.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Scheduling Preferences
      </Typography>
      
      <Alert 
        severity={totalHours < month.targetHours ? "warning" : totalHours > month.targetHours * 1.2 ? "error" : "success"} 
        sx={{ mb: 3 }}
      >
        Your estimated total hours: <strong>{totalHours} hours</strong> (Target: {month.targetHours} hours)
        {totalHours < month.targetHours && (
          <div>You are below the target hours. Consider adding more shifts.</div>
        )}
        {totalHours > month.targetHours * 1.2 && (
          <div>You are significantly above the target hours. The system will need to make significant adjustments.</div>
        )}
      </Alert>
      
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ p: 2, pb: 1 }}>
          Weekday Preferences (Flexible)
        </Typography>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Day of Week</TableCell>
                <TableCell>Preferred Shift</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {DAYS_OF_WEEK.map((day) => {
                const preference = currentPreference.weekdayPreferences.find(
                  (pref) => pref.dayOfWeek === day.value
                );
                const shift = preference ? getShiftByValue(preference.shiftPreference) : null;
                
                return (
                  <TableRow key={day.value}>
                    <TableCell>{day.label}</TableCell>
                    <TableCell>
                      {shift ? shift.label : 'No preference'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box p={2} pt={1}>
          <Chip 
            label={`Estimated hours from weekday preferences: ~${weekdayHours} hours`} 
            color="primary" 
            variant="outlined" 
            size="small" 
          />
        </Box>
      </Paper>
      
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ p: 2, pb: currentPreference.exactDatePreferences.length > 0 ? 1 : 2 }}>
          Fixed Date Preferences
        </Typography>
        
        {currentPreference.exactDatePreferences.length > 0 ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentPreference.exactDatePreferences.map((preference, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDateWithDayOfWeek(new Date(preference.exactDate))}</TableCell>
                      <TableCell>{preference.startTime} - {preference.endTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box p={2} pt={1}>
              <Chip 
                label={`Hours from fixed preferences: ${fixedHours} hours`} 
                color="secondary" 
                variant="outlined" 
                size="small" 
              />
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ px: 2, pb: 2 }}>
            No fixed date preferences added.
          </Typography>
        )}
      </Paper>
      
      <Box display="flex" justifyContent="space-between" mt={2}>
        <Box>
          <Button onClick={onBack} sx={{ mr: 1 }} disabled={isLoading}>
            Back
          </Button>
          <Button onClick={onReset} disabled={isLoading}>
            Start Over
          </Button>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {currentPreference.id ? 'Update Preferences' : 'Submit Preferences'}
        </Button>
      </Box>
    </Box>
  );
};

export default PreferenceReview;