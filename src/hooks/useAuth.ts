import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  logout, 
  setCredentials, 
  clearError,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthError,
  selectAuthLoading
} from '../store/slices/authSlice';
import AuthService from '../services/auth.service';

// Custom hook for authentication
const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Select from store
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const error = useSelector(selectAuthError);
  const isLoading = useSelector(selectAuthLoading);

  // Login handler
  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      dispatch(clearError());
      const response = await AuthService.login({ email, password });
      dispatch(setCredentials({
        user: response.user,
        token: response.token
      }));
      
      // Store refresh token in localStorage
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Redirect based on user role
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, [dispatch, navigate]);

  // Register handler
  const handleRegister = useCallback(async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    position: string;
    department?: string;
  }) => {
    try {
      dispatch(clearError());
      const response = await AuthService.register(userData);
      dispatch(setCredentials({
        user: response.user,
        token: response.token
      }));
      
      // Store refresh token in localStorage
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  }, [dispatch, navigate]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await AuthService.logout();
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [dispatch, navigate]);

  return {
    user,
    isAuthenticated,
    error,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout
  };
};

export default useAuth;