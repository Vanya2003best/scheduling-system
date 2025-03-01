import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  fetchAvailableSchedules,
  fetchSchedule,
  selectAvailableSchedules,
  selectCurrentSchedule,
  selectScheduleLoading,
  selectScheduleError,
  resetCurrentSchedule,
  MonthSchedule
} from '../../store/slices/scheduleSlice';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Alert, 
  CircularProgress,
  Divider,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ScheduleCalendar from './ScheduleCalendar';
import ScheduleSummary from './ScheduleSummary';
import ScheduleList from './ScheduleList';

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
      id={`schedule-tabpanel-${index}`}
      aria-labelledby={`schedule-tab-${index}`}
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

const ScheduleViewer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const availableSchedules = useSelector(selectAvailableSchedules);
  const currentSchedule = useSelector(selectCurrentSchedule);
  const isLoading = useSelector(selectScheduleLoading);
  const error = useSelector(selectScheduleError);

  const [selectedSchedule, setSelectedSchedule] = useState<MonthSchedule | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    dispatch(fetchAvailableSchedules());
  }, [dispatch]);

  useEffect(() => {
    // Reset selection when available schedules change or component unmounts
    return () => {
      dispatch(resetCurrentSchedule());
    };
  }, [dispatch]);

  const handleScheduleChange = (event: any) => {
    const selectedId = event.target.value;
    const schedule = availableSchedules.find(s => s.id === selectedId) || null;
    setSelectedSchedule(schedule);
    
    if (schedule) {
      dispatch(fetchSchedule(schedule.id.toString()));
    } else {
      dispatch(resetCurrentSchedule());
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Work Schedule
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="schedule-select-label">Select Month</InputLabel>
          <Select
            labelId="schedule-select-label"
            id="schedule-select"
            value={selectedSchedule?.id || ''}
            label="Select Month"
            onChange={handleScheduleChange}
            disabled={isLoading}
          >
            {availableSchedules.map((schedule) => (
              <MenuItem key={schedule.id} value={schedule.id}>
                {schedule.monthName} {schedule.year} - {schedule.status.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {isLoading && (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        )}
        
        {!isLoading && !selectedSchedule && availableSchedules.length > 0 && (
          <Alert severity="info">
            Please select a month to view your schedule.
          </Alert>
        )}
        
        {!isLoading && availableSchedules.length === 0 && (
          <Alert severity="warning">
            No schedules are available for viewing yet.
          </Alert>
        )}
        
        {currentSchedule && (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="schedule view tabs"
                centered
              >
                <Tab icon={<CalendarMonthIcon />} label="Calendar View" />
                <Tab icon={<ListAltIcon />} label="List View" />
              </Tabs>
            </Box>
            
            <ScheduleSummary schedule={currentSchedule} />
            
            <TabPanel value={tabValue} index={0}>
              <ScheduleCalendar schedule={currentSchedule} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <ScheduleList schedule={currentSchedule} />
            </TabPanel>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ScheduleViewer;