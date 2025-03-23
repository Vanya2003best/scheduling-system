// src/services/api.ts
import axios from 'axios';

// Создаем отдельную функцию для обновления токена без использования axios instance
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await axios.post(
    `${process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1'}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );
    
  if (response.data && response.data.token) {
    localStorage.setItem('token', response.data.token);
    return response.data.token;
  }
  throw new Error('Failed to refresh token');
};

// Создаем экземпляр axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Интерцептор запросов - добавляет токен в заголовок
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерцептор ответов - обрабатывает ошибки авторизации
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если ошибка не связана с авторизацией, просто возвращаем ошибку
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }
    
    // Избегаем бесконечного цикла повторных запросов
    if (originalRequest._retry) {
      // Если это уже повторная попытка, перенаправляем на логин
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    originalRequest._retry = true;
    
    try {
      // Пытаемся обновить токен
      const newToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      
      // Повторяем запрос с новым токеном
      return axios(originalRequest);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      
      // Если не получилось обновить, очищаем хранилище и перенаправляем
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

export default api;