import api from './api';
import axios from 'axios';

// Types
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  position: string;
  department?: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

const AuthService = {
  // Login user
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Register user
  register: async (credentials: RegisterCredentials) => {
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  },

  // Logout user
  logout: async () => {
    // Get the refresh token from localStorage
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear tokens from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      // Используем axios напрямую для избежания циклических зависимостей
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1'}/auth/refresh`, 
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        return response.data;
      } else {
        throw new Error('Invalid response from refresh token endpoint');
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  },

  // Добавлен метод changePassword внутри объекта AuthService
  changePassword: async (data: { 
    currentPassword: string, 
    newPassword: string 
  }) => {
    try {
      const response = await api.post('/auth/change-password', data);
      return response.data;
    } catch (error: any) {
      // Обработка ошибок
      throw error;
    }
  }
};

export default AuthService;