import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  fetchAvailableMonths,
  selectAvailableMonths,
  selectPreferenceLoading,
  selectPreferenceError,
  selectPreferenceSuccess,
  resetCurrentPreference,
  clearSuccess,
  MonthOption
} from '../../store/slices/preferenceSlice';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Alert, 
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material';
import WeekdayPreferences from './WeekdayPreferences';
import ExactDatePreferences from './ExactDatePreferences';
import PreferenceReview from './PreferenceReview';

const PreferenceSubmission: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const availableMonths = useSelector(selectAvailableMonths);
  const isLoading = useSelector(selectPreferenceLoading);
  const error = useSelector(selectPreferenceError);
  const success = useSelector(selectPreferenceSuccess);

  const [selectedMonth, setSelectedMonth] = useState<MonthOption | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Select Month', 'Weekday Preferences', 'Fixed Date Preferences', 'Review & Submit'];

  useEffect(() => {
    dispatch(fetchAvailableMonths());
  }, [dispatch]);

  useEffect(() => {
    // Reset form if successful submission
    if (success) {
      setTimeout(() => {
        dispatch(clearSuccess());
        setActiveStep(0);
        setSelectedMonth(null);
        dispatch(resetCurrentPreference());
      }, 3000);
    }
  }, [success, dispatch]);

  const handleMonthChange = (event: any) => {
    const selectedId = event.target.value;
    const month = availableMonths.find(m => m.id === selectedId) || null;
    setSelectedMonth(month);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedMonth(null);
    dispatch(resetCurrentPreference());
  };

  const renderStepContent = (step: number) => {
    if (!selectedMonth && step > 0) {
      return (
        <Alert severity="warning">
          Please select a month first.
        </Alert>
      );
    }

    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="month-select-label">Target Month</InputLabel>
              <Select
                labelId="month-select-label"
                id="month-select"
                value={selectedMonth?.id || ''}
                label="Target Month"
                onChange={handleMonthChange}
                disabled={isLoading}
              >
                {availableMonths.map((month) => (
                  <MenuItem key={month.id} value={month.id}>
                    {month.monthName} {month.year} ({month.targetHours} hours)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {selectedMonth && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Target working hours: <strong>{selectedMonth.targetHours} hours</strong> for {selectedMonth.monthName} {selectedMonth.year}
              </Alert>
            )}
            
            <Button 
              variant="contained" 
              onClick={handleNext}
              disabled={!selectedMonth || isLoading}
              sx={{ mt: 2 }}
            >
              Next
            </Button>
          </Box>
        );
      case 1:
        return (
          <WeekdayPreferences 
            month={selectedMonth!}
            onBack={handleBack}
            onNext={handleNext}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <ExactDatePreferences 
            month={selectedMonth!}
            onBack={handleBack} 
            onNext={handleNext}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <PreferenceReview
            month={selectedMonth!}
            onBack={handleBack}
            onReset={handleReset}
            isLoading={isLoading}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Schedule Preference Submission
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your preferences have been submitted successfully!
          </Alert>
        )}
        
        {isLoading && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        )}
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {renderStepContent(activeStep)}
      </Paper>
    </Container>
  );
};

export default PreferenceSubmission;