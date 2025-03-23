import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  fetchPreference,
  updateWeekdayPreference,
  selectCurrentPreference,
  setCurrentPreference,
  MonthOption,
  WeekdayPreference as WeekdayPreferenceType
} from '../../store/slices/preferenceSlice';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Paper,
  Divider
} from '@mui/material';
import { DAYS_OF_WEEK, SHIFT_DEFINITIONS } from '../../utils/constants';

interface WeekdayPreferencesProps {
  month: MonthOption;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

const WeekdayPreferences: React.FC<WeekdayPreferencesProps> = ({ 
  month, 
  onBack, 
  onNext,
  isLoading
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentPreference = useSelector(selectCurrentPreference);
  const [initialized, setInitialized] = useState(false);

  // Load the current preference on component mount
  useEffect(() => {
    if (month && !initialized) {
      dispatch(fetchPreference(month.id.toString()));
      setInitialized(true);
    }
  }, [dispatch, month, initialized]);

  // Handle preference change for a day
  const handlePreferenceChange = (dayOfWeek: string, shiftPreference: string | null) => {
    if (currentPreference) {
      dispatch(updateWeekdayPreference({
        dayOfWeek,
        shiftPreference
      }));
    } else {
      // Если currentPreference не существует, сначала создаем его с базовыми данными
      const basePreference = {
        targetMonth: month.monthName,
        targetYear: month.year,
        weekdayPreferences: [],
        exactDatePreferences: []
      };
      dispatch(setCurrentPreference(basePreference));
      // Затем добавляем новое предпочтение
      setTimeout(() => {
        dispatch(updateWeekdayPreference({
          dayOfWeek,
          shiftPreference
        }));
      }, 100);
    }
  };

  // Get current preference for a day
  const getPreferenceForDay = (dayOfWeek: string): string | null => {
    if (!currentPreference) return null;
    
    const preference = currentPreference.weekdayPreferences.find(
      (pref) => pref.dayOfWeek === dayOfWeek
    );
    
    return preference ? preference.shiftPreference : null;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Your Preferred Shifts by Day of Week
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        These preferences are flexible and may be adjusted by the scheduling system to meet overall constraints.
        Select your preferred shift for each day of the week below. If you want to mark a day as off, select "Dzień wolny".
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3}>
          {DAYS_OF_WEEK.map((day) => (
            <Grid item xs={12} md={6} key={day.value}>
              <FormControl fullWidth>
                <InputLabel id={`shift-select-${day.value}`}>{day.label}</InputLabel>
                <Select
                  labelId={`shift-select-${day.value}`}
                  id={`shift-${day.value}`}
                  value={getPreferenceForDay(day.value) || ''}
                  label={day.label}
                  onChange={(e) => handlePreferenceChange(day.value, e.target.value)}
                  disabled={isLoading}
                >
                  {SHIFT_DEFINITIONS.map((shift) => (
                    <MenuItem key={shift.value || 'day-off'} value={shift.value || ''}>
                      {shift.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>
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

export default WeekdayPreferences;