import { useNavigate } from 'react-router-dom';
import { MONTH_NAMES } from '../../utils/constants';
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
  Divider,
  Card,
  CardContent
} from '@mui/material';
import WeekdayPreferences from './WeekdayPreferences';
import ExactDatePreferences from './ExactDatePreferences';
import PreferenceReview from './PreferenceReview';

const PreferenceSubmission: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const availableMonths = useSelector(selectAvailableMonths);
  const isLoading = useSelector(selectPreferenceLoading);
  const error = useSelector(selectPreferenceError);
  const success = useSelector(selectPreferenceSuccess);

  const [selectedMonth, setSelectedMonth] = useState<MonthOption | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Select Month', 'Weekday Preferences', 'Fixed Date Preferences', 'Review & Submit'];
  
  useEffect(() => {
    if (error === 'Invalid or expired token') {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      // Логируем для диагностики
      console.log('Current token:', token);
      console.log('Current refreshToken:', refreshToken?.substring(0, 10) + '...');
      
      // Попытка заново авторизоваться
      if (refreshToken) {
        // Форсированно установить временный токен для отладки
        localStorage.setItem('token', 'temporary_debug_token');
        
        // Перезагрузить страницу через 1 секунду
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // Если нет refresh token, перейти на страницу логина
        navigate('/login');
      }
    }
  }, [error, navigate]);

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

  const renderMonthSelection = () => {
    return (
      <Box sx={{ mt: 2 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : availableMonths.length > 0 ? (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Выберите месяц для подачи предпочтений:
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {availableMonths.map((month) => (
                <Grid item xs={12} sm={6} md={3} key={month.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedMonth?.id === month.id ? 2 : 1,
                      borderColor: selectedMonth?.id === month.id ? 'primary.main' : 'divider'
                    }}
                    onClick={() => handleMonthChange({ target: { value: month.id } })}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {month.monthName} {month.year}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        Целевые часы: <strong>{month.targetHours} часов</strong>
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {selectedMonth && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Выбран месяц: <strong>{selectedMonth.monthName} {selectedMonth.year}</strong>,
                целевые часы: <strong>{selectedMonth.targetHours} часов</strong>
              </Alert>
            )}
            
            <Button 
              variant="contained" 
              onClick={handleNext}
              disabled={!selectedMonth || isLoading}
              sx={{ mt: 2 }}
            >
              Далее
            </Button>
          </>
        ) : (
          <Alert severity="warning">
            Нет доступных месяцев для подачи предпочтений. Обратитесь к администратору системы.
          </Alert>
        )}
      </Box>
    );
  };
  const renderStepContent = (step: number) => {
  const determineAvailableMonths = () => {
    const today = new Date();
    const isAfter20th = today.getDate() > 20;
    const months = [];
    
    // Начальный месяц зависит от текущей даты
    let startIndex = isAfter20th ? 1 : 0;
    
    for (let i = 0; i < 4; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + startIndex + i, 1);
      
      const month = {
        id: i,
        monthName: MONTH_NAMES[monthDate.getMonth()],
        monthNumber: monthDate.getMonth() + 1,
        year: monthDate.getFullYear(),
        isEditable: !(isAfter20th && i === 0), // Блокировка текущего месяца после 20-го числа
        targetHours: 168 // Целевые часы (можно динамически получать из бэкенда)
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
                Выберите месяц для подачи предпочтений:
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
                          Целевые часы: <strong>{month.targetHours} часов</strong>
                        </Typography>
                        {!month.isEditable && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                            Редактирование закрыто
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {selectedMonth && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Выбран месяц: <strong>{selectedMonth.monthName} {selectedMonth.year}</strong>,
                  целевые часы: <strong>{selectedMonth.targetHours} часов</strong>
                </Alert>
              )}
            </>
          ) : (
            <Alert severity="warning">
              Нет доступных месяцев для подачи предпочтений. Обратитесь к администратору системы.
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