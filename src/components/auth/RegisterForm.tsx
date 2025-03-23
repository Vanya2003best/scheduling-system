import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Button, 
  TextField, 
  Paper, 
  Typography, 
  Container, 
  Box, 
  Grid, 
  Link, 
  Alert
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AuthService from '../../services/auth.service';

// Схема валидации
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Введите корректный email')
    .required('Email обязателен'),
  password: Yup.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .required('Пароль обязателен'),
  firstName: Yup.string()
    .required('Имя обязательно'),
  lastName: Yup.string()
    .required('Фамилия обязательна'),
  position: Yup.string()
    .required('Должность обязательна')
});

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      position: '',
      department: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await AuthService.register(values);
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Ошибка при регистрации');
      }
    }
  });

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Регистрация
        </Typography>
        
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="firstName"
                name="firstName"
                label="Имя"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="lastName"
                name="lastName"
                label="Фамилия"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Пароль"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="position"
                name="position"
                label="Должность"
                value={formik.values.position}
                onChange={formik.handleChange}
                error={formik.touched.position && Boolean(formik.errors.position)}
                helperText={formik.touched.position && formik.errors.position}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="department"
                name="department"
                label="Отдел (необязательно)"
                value={formik.values.department}
                onChange={formik.handleChange}
              />
            </Grid>
          </Grid>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            Зарегистрироваться
          </Button>
          
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Уже есть аккаунт? Войти
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterForm;