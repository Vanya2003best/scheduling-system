import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Box, 
  Alert,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import UserService from '../../services/user.service';
import AuthService from '../../services/auth.service';

// Определим интерфейс для формы
interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object({
    currentPassword: Yup.string()
      .required('Текущий пароль обязателен'),
    newPassword: Yup.string()
      .min(8, 'Новый пароль должен содержать минимум 8 символов')
      .required('Новый пароль обязателен'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], 'Пароли должны совпадать')
      .required('Подтверждение пароля обязательно')
  });

  const formik = useFormik<ChangePasswordFormValues>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      try {
        // Используем UserService для смены пароля
        await UserService.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        });
        
        setSuccess('Пароль успешно изменен');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (err: any) {
        setError(
          err.response?.data?.message || 
          err.response?.data?.error || 
          'Не удалось изменить пароль'
        );
      } finally {
        setIsLoading(false);
        formik.resetForm();
      }
    }
  });

  return (
    <Container maxWidth="xs">
      <Box sx={{ 
        marginTop: 8, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}>
        <Typography component="h1" variant="h5">
          Смена пароля
        </Typography>
        
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="currentPassword"
            label="Текущий пароль"
            type="password"
            id="currentPassword"
            value={formik.values.currentPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.currentPassword && Boolean(formik.errors.currentPassword)}
            helperText={formik.touched.currentPassword && formik.errors.currentPassword}
            disabled={isLoading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="Новый пароль"
            type="password"
            id="newPassword"
            value={formik.values.newPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
            helperText={formik.touched.newPassword && formik.errors.newPassword}
            disabled={isLoading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Подтвердите новый пароль"
            type="password"
            id="confirmPassword"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            disabled={isLoading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Изменить пароль'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            disabled={isLoading}
            sx={{ mt: 1 }}
          >
            Отмена
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ChangePasswordForm;