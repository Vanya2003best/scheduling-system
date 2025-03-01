import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  fetchAvailableSchedules,
  selectAvailableSchedules
} from '../../store/slices/scheduleSlice';
import {
  generateSchedule,
  publishSchedule,
  checkJobStatus,
  selectCurrentJob,
  clearCurrentJob,
  ScheduleGenerationParams
} from '../../store/slices/adminSlice';
import { 
  Box, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  LinearProgress,
  Paper
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PublishIcon from '@mui/icons-material/Publish';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import StopIcon from '@mui/icons-material/Stop';

const ScheduleGenerationPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const availableSchedules = useSelector(selectAvailableSchedules);
  const currentJob = useSelector(selectCurrentJob);
  
  const [selectedMonthId, setSelectedMonthId] = useState<string>('');
  const [useExistingAsBase, setUseExistingAsBase] = useState(true);
  const [prioritizeFixedShifts, setPrioritizeFixedShifts] = useState(true);
  const [maximizePreferenceSatisfaction, setMaximizePreferenceSatisfaction] = useState(true);
  
  // Polling for job status
  useEffect(() => {
    if (currentJob && (currentJob.status === 'pending' || currentJob.status === 'running')) {
      const interval = setInterval(() => {
        dispatch(checkJobStatus(currentJob.id));
      }, 2000); // Poll every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [currentJob, dispatch]);
  
  useEffect(() => {
    dispatch(fetchAvailableSchedules());
  }, [dispatch]);

  const handleGenerateSchedule = () => {
    if (!selectedMonthId) return;
    
    const params: ScheduleGenerationParams = {
      monthId: parseInt(selectedMonthId),
      options: {
        useExistingAsBase,
        prioritizeFixedShifts,
        maximizePreferenceSatisfaction
      }
    };
    
    dispatch(generateSchedule(params));
  };

  const handlePublishSchedule = () => {
    if (!selectedMonthId) return;
    
    dispatch(publishSchedule(parseInt(selectedMonthId)));
  };

  const handleCancelJob = () => {
    dispatch(clearCurrentJob());
  };

  const renderJobStatus = () => {
    if (!currentJob) return null;
    
    let statusColor = 'info';
    if (currentJob.status === 'completed') statusColor = 'success';
    if (currentJob.status === 'failed') statusColor = 'error';
    
    return (
      <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Schedule Generation Job: {currentJob.id}
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" gutterBottom>
              Status: 
              <Alert severity={statusColor as any} sx={{ display: 'inline', mx: 1, py: 0, px: 1 }}>
                {currentJob.status.toUpperCase()}
              </Alert>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={8}>
            <Typography variant="subtitle2" gutterBottom>
              Progress:
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={currentJob.progress} 
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="caption" align="right" display="block">
              {currentJob.progress}%
            </Typography>
          </Grid>
        </Grid>
        
        {currentJob.status === 'completed' && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Schedule generation completed successfully! You can now publish the schedule.
          </Alert>
        )}
        
        {currentJob.status === 'failed' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {currentJob.error || 'Schedule generation failed. Please try again.'}
          </Alert>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleCancelJob}
            startIcon={<StopIcon />}
          >
            Dismiss
          </Button>
        </Box>
      </Paper>
    );
  };

  const isGeneratingOrPublishing = currentJob?.status === 'pending' || currentJob?.status === 'running';
  const isDraftAvailable = availableSchedules.some(s => s.status === 'draft');

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Schedule Generation
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Generate and publish work schedules for employees based on their preferences and system constraints.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Generate Schedule
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="month-select-label">Target Month</InputLabel>
                <Select
                  labelId="month-select-label"
                  id="month-select"
                  value={selectedMonthId}
                  label="Target Month"
                  onChange={(e) => setSelectedMonthId(e.target.value as string)}
                  disabled={isGeneratingOrPublishing}
                >
                  {availableSchedules.map((schedule) => (
                    <MenuItem key={schedule.id} value={schedule.id.toString()}>
                      {schedule.monthName} {schedule.year} - {schedule.status.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Typography variant="subtitle2" gutterBottom>
                Generation Options:
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useExistingAsBase}
                    onChange={(e) => setUseExistingAsBase(e.target.checked)}
                    disabled={isGeneratingOrPublishing}
                  />
                }
                label="Use existing schedule as base (if available)"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={prioritizeFixedShifts}
                    onChange={(e) => setPrioritizeFixedShifts(e.target.checked)}
                    disabled={isGeneratingOrPublishing}
                  />
                }
                label="Prioritize fixed shift preferences"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={maximizePreferenceSatisfaction}
                    onChange={(e) => setMaximizePreferenceSatisfaction(e.target.checked)}
                    disabled={isGeneratingOrPublishing}
                  />
                }
                label="Maximize preference satisfaction"
              />
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={handleGenerateSchedule}
                disabled={!selectedMonthId || isGeneratingOrPublishing}
              >
                Generate Schedule
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" color="secondary" gutterBottom>
                Publish Schedule
              </Typography>
              
              <Typography variant="body2" paragraph>
                Publishing a schedule makes it visible to all employees and sends them notifications.
                Once published, the schedule can still be adjusted manually if needed.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                {isDraftAvailable ? 
                  'You have draft schedules ready to be published.' : 
                  'No draft schedules available. Generate a schedule first.'}
              </Alert>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                startIcon={<PublishIcon />}
                onClick={handlePublishSchedule}
                disabled={!selectedMonthId || !isDraftAvailable || isGeneratingOrPublishing}
              >
                Publish Schedule
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      {renderJobStatus()}
    </Box>
  );
};

export default ScheduleGenerationPanel;