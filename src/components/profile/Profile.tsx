import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import {
  selectCurrentUser,
  selectAuthLoading,
  selectAuthError,
  updateUserProfile,
  clearError
} from '../../store/slices/authSlice';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  Avatar, 
  Divider, 
  Alert, 
  CircularProgress,
  Tab,
  Tabs
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import useAuth from '../../hooks/useAuth';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading, error } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // Форма профиля
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    department: '',
  });

  // Форма изменения пароля
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Загрузка данных пользователя в форму
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        position: user.position || '',
        department: user.department || '',
      });
    }
  }, [user]);

  // Очистка сообщения об успехе через 5 секунд
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Управление изменением вкладок
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Обработка изменений в форме профиля
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Обработка изменений в форме пароля
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordError(null);
  };

  // Сохранение изменений профиля
  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      // Здесь бы был вызов асинхронного действия для обновления профиля через API
      // dispatch(updateUserProfile(profileForm));
      
      // Для демонстрации:
      setSuccessMessage('Профиль успешно обновлен');
    } catch (err) {
      console.error('Ошибка при обновлении профиля', err);
    }
  };

  // Изменение пароля
  const handleChangePassword = async () => {
    // Базовая валидация
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Новый пароль должен содержать не менее 8 символов');
      return;
    }

    try {
      // Здесь бы был вызов API для изменения пароля
      // await AuthService.changePassword(passwordForm);
      
      // Сброс формы и отображение успеха
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setSuccessMessage('Пароль успешно изменен');
    } catch (err) {
      setPasswordError('Ошибка при изменении пароля');
      console.error('Ошибка при изменении пароля', err);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Alert severity="warning">
            Необходимо авторизоваться для доступа к профилю
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              mr: 3
            }}
          >
            {user.firstName?.[0] || user.email[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Профиль пользователя
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Управление вашей информацией и настройками
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="Профиль пользователя"
          >
            <Tab icon={<PersonIcon />} label="Личная информация" />
            <Tab icon={<LockIcon />} label="Безопасность" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Имя"
                name="firstName"
                value={profileForm.firstName}
                onChange={handleProfileChange}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Фамилия"
                name="lastName"
                value={profileForm.lastName}
                onChange={handleProfileChange}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                disabled={true} // Email нельзя изменить
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Должность"
                name="position"
                value={profileForm.position}
                onChange={handleProfileChange}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Отдел"
                name="department"
                value={profileForm.department}
                onChange={handleProfileChange}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  startIcon={<SaveIcon />}
                >
                  Сохранить изменения
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Текущий пароль"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Новый пароль"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                disabled={isLoading}
                helperText="Пароль должен содержать не менее 8 символов"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Подтверждение нового пароля"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                disabled={isLoading}
                error={Boolean(passwordError)}
                helperText={passwordError}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleChangePassword}
                  disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                >
                  Изменить пароль
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        {isLoading && (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Profile;