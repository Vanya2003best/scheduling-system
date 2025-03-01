import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid,
  Chip,
  Divider,
  useTheme
} from '@mui/material';
import { format } from 'date-fns';
import { Schedule, ScheduleEntry } from '../../store/slices/scheduleSlice';
import { getShiftByValue } from '../../utils/constants';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LockIcon from '@mui/icons-material/Lock';

interface ScheduleCalendarProps {
  schedule: Schedule;
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ schedule }) => {
  const theme = useTheme();

  // Group entries by weeks
  const weeks: ScheduleEntry[][] = [];
  let currentWeek: ScheduleEntry[] = [];
  let currentWeekNumber = 0;

  // Sort entries by date
  const sortedEntries = [...schedule.entries].sort((a, b) => 
    new Date(a.scheduleDate).getTime() - new Date(b.scheduleDate).getTime()
  );

  // Group by weeks
  sortedEntries.forEach((entry) => {
    const entryDate = new Date(entry.scheduleDate);
    const weekNumber = Math.floor((entryDate.getDate() - 1) / 7);
    
    if (weekNumber !== currentWeekNumber && currentWeek.length > 0) {
      weeks.push([...currentWeek]);
      currentWeek = [];
      currentWeekNumber = weekNumber;
    }
    
    currentWeek.push(entry);
  });
  
  // Add the last week
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const renderShiftLabel = (entry: ScheduleEntry) => {
    if (entry.isDayOff) {
      return (
        <Box display="flex" alignItems="center" color="text.secondary">
          <EventBusyIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2">Day Off</Typography>
        </Box>
      );
    }

    const startTime = entry.startTime || '';
    const endTime = entry.endTime || '';
    
    return (
      <Box>
        <Box display="flex" alignItems="center" color="primary.main">
          <EventAvailableIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2" fontWeight={500}>
            {startTime} - {endTime}
          </Typography>
        </Box>
        {entry.isFixedShift && (
          <Chip 
            icon={<LockIcon />} 
            label="Fixed" 
            size="small" 
            color="secondary" 
            variant="outlined"
            sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} 
          />
        )}
      </Box>
    );
  };

  const renderDay = (entry: ScheduleEntry) => {
    const date = new Date(entry.scheduleDate);
    const isToday = new Date().toDateString() === date.toDateString();
    
    return (
      <Paper 
        key={entry.id} 
        variant="outlined" 
        sx={{ 
          p: 1, 
          height: '100%',
          minHeight: 100,
          backgroundColor: isToday ? 'rgba(45, 108, 165, 0.05)' : 'white',
          borderColor: isToday ? theme.palette.primary.main : undefined,
          borderWidth: isToday ? 2 : 1
        }}
      >
        <Typography variant="subtitle2" color={isToday ? 'primary' : 'textSecondary'}>
          {format(date, 'EEEE')}
        </Typography>
        <Typography variant="h6" gutterBottom>
          {format(date, 'd')}
        </Typography>
        <Divider sx={{ my: 1 }} />
        {renderShiftLabel(entry)}
      </Paper>
    );
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        {schedule.monthName} {schedule.year} Schedule
      </Typography>
      
      {weeks.map((week, weekIndex) => (
        <Grid container spacing={1} key={weekIndex} sx={{ mb: 1 }}>
          {week.map(entry => (
            <Grid item xs={12 / 7} key={entry.id}>
              {renderDay(entry)}
            </Grid>
          ))}
        </Grid>
      ))}
    </Box>
  );
};

export default ScheduleCalendar;