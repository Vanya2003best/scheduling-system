import { useNavigate } from 'react-router-dom';
import { MONTH_NAMES } from '../../utils/constants';
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Button, 
  Alert, 
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import WeekdayPreferences from './WeekdayPreferences';
import ExactDatePreferences from './ExactDatePreferences';
import PreferenceReview from './PreferenceReview';

interface MonthOption {
  id: number;
  monthName: string;
  monthNumber: number;
  year: number;
  isEditable: boolean;
  targetHours: number;
}

const PreferenceSubmission: React.FC = () => {
  const navigate = useNavigate();

  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<MonthOption | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Select Month', 'Weekday Preferences', 'Fixed Date Preferences', 'Review & Submit'];
  
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/api/v1/preferences/available-months');
        setAvailableMonths(response.data);
        setIsLoading(false);
      } catch (fetchError) {
        console.error('Error fetching months:', fetchError);
      }
    };
    
    fetchMonths();
  }, []);

  useEffect(() => {
    // Token expiration handling
    if (error === 'Invalid or expired token') {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      console.log('Current token:', token);
      console.log('Current refreshToken:', refreshToken?.substring(0, 10) + '...');
      
      if (refreshToken) {
        localStorage.setItem('token', 'temporary_debug_token');
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        navigate('/login');
      }
    }
  }, [error, navigate]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedMonth(null);
  };

  const renderStepContent = (step: number) => {
    const determineAvailableMonths = () => {
      const today = new Date();
      const isAfter20th = today.getDate() > 20;
      const months = [];
      
      let startIndex = isAfter20th ? 1 : 0;
      
      for (let i = 0; i < 4; i++) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() + startIndex + i, 1);
        
        const month = {
          id: i,
          monthName: MONTH_NAMES[monthDate.getMonth()],
          monthNumber: monthDate.getMonth() + 1,
          year: monthDate.getFullYear(),
          isEditable: !(isAfter20th && i === 0),
          targetHours: 168
        };
        
        months.push(month);
      }
      
      return months;
    };

    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            {isLoading ? (
              <Box display="flex" justifyContent="center" my={3}>
                <CircularProgress />
              </Box>
            ) : availableMonths.length > 0 ? (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Select Month for Preferences:
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {determineAvailableMonths().map((month) => (
                    <Grid item xs={12} sm={6} md={3} key={month.id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: month.isEditable ? 'pointer' : 'not-allowed',
                          border: selectedMonth?.id === month.id ? 2 : 1,
                          borderColor: selectedMonth?.id === month.id ? 'primary.main' : 'divider',
                          opacity: month.isEditable ? 1 : 0.5
                        }}
                        onClick={() => {
                          if (month.isEditable) {
                            setSelectedMonth(month);
                            handleNext();
                          }
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {month.monthName} {month.year}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" color="textSecondary">
                            Target Hours: <strong>{month.targetHours} hours</strong>
                          </Typography>
                          {!month.isEditable && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                              Editing Closed
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                {selectedMonth && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Selected Month: <strong>{selectedMonth.monthName} {selectedMonth.year}</strong>,
                    Target Hours: <strong>{selectedMonth.targetHours} hours</strong>
                  </Alert>
                )}
              </>
            ) : (
              <Alert severity="warning">
                No available months for preference submission. Please contact system administrator.
              </Alert>
            )}
          </Box>
        );
      case 1:
        return selectedMonth && (
          <WeekdayPreferences 
            month={selectedMonth}
            onBack={handleBack}
            onNext={handleNext}
            isLoading={isLoading}
          />
        );
      case 2:
        return selectedMonth && (
          <ExactDatePreferences 
            month={selectedMonth}
            onBack={handleBack} 
            onNext={handleNext}
            isLoading={isLoading}
          />
        );
      case 3:
        return selectedMonth && (
          <PreferenceReview
            month={selectedMonth}
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
        
        {isLoading && !activeStep ? (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        ) : null}
        
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