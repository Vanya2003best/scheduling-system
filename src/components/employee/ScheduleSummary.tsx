import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  LinearProgress,
  useTheme
} from '@mui/material';
import { Schedule } from '../../store/slices/scheduleSlice';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import LockIcon from '@mui/icons-material/Lock';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import EventBusyIcon from '@mui/icons-material/EventBusy';

interface ScheduleSummaryProps {
  schedule: Schedule;
}

const ScheduleSummary: React.FC<ScheduleSummaryProps> = ({ schedule }) => {
  const theme = useTheme();
  
  // Calculate progress percentage
  const targetHoursForMonth = 168; // This should come from API in real implementation
  const progressPercentage = Math.min(Math.round((schedule.summary.totalHours / targetHoursForMonth) * 100), 100);
  
  // Determine status color based on progress
  let statusColor = theme.palette.success.main;
  let statusText = 'On Track';
  
  if (progressPercentage < 90) {
    statusColor = theme.palette.warning.main;
    statusText = 'Under Hours';
  } else if (progressPercentage > 105) {
    statusColor = theme.palette.error.main;
    statusText = 'Over Hours';
  }
  
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Schedule Summary
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Typography variant="subtitle1">Hours Progress:</Typography>
          </Grid>
          <Grid item xs>
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  backgroundColor: statusColor
                }
              }} 
            />
          </Grid>
          <Grid item>
            <Chip 
              label={`${schedule.summary.totalHours} / ${targetHoursForMonth} hours`} 
              color={
                progressPercentage < 90 ? 'warning' : 
                progressPercentage > 105 ? 'error' : 
                'success'
              }
            />
          </Grid>
        </Grid>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Status: <span style={{ color: statusColor, fontWeight: 'bold' }}>{statusText}</span>
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center">
            <AccessTimeIcon sx={{ mr: 1 }} fontSize="small" />
            Hours Breakdown
          </Typography>
          
          <List dense>
            {schedule.summary.weeklyHours.map((week, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemText 
                  primary={`Week ${week.weekNumber + 1}`}
                  secondary={`${week.hours} hours`}
                />
                <Chip 
                  label={week.hours > 60 ? 'Over Limit' : 'OK'} 
                  color={week.hours > 60 ? 'error' : 'success'} 
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center">
            <EventIcon sx={{ mr: 1 }} fontSize="small" />
            Shift Statistics
          </Typography>
          
          <List dense>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText 
                primary="Fixed Shifts"
                secondary="Cannot be adjusted by the system"
              />
              <Chip 
                icon={<LockIcon fontSize="small" />}
                label={schedule.summary.fixedShifts}
                color="secondary"
                size="small"
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText 
                primary="Flexible Shifts"
                secondary="Based on your weekday preferences"
              />
              <Chip 
                icon={<DoneAllIcon fontSize="small" />}
                label={schedule.summary.flexibleShifts}
                color="primary"
                size="small"
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemText 
                primary="Days Off"
                secondary="No work scheduled"
              />
              <Chip 
                icon={<EventBusyIcon fontSize="small" />}
                label={schedule.summary.daysOff}
                color="default"
                size="small"
              />
            </ListItem>
          </List>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Box>
        <Typography variant="subtitle2" color="textSecondary">
          Schedule Status: 
          <Chip 
            label={schedule.status.toUpperCase()}
            color={
              schedule.status === 'published' ? 'success' :
              schedule.status === 'draft' ? 'warning' : 
              'default'
            }
            size="small"
            sx={{ ml: 1 }}
          />
        </Typography>
      </Box>
    </Paper>
  );
};

export default ScheduleSummary;