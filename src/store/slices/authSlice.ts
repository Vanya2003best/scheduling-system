import UserService from '../../services/user.service';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Types
interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  position?: string;
  department?: string;
}

export interface UserProfileData {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null; // Добавлено поле для сообщений об успехе
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  successMessage: null // Инициализация нового поля
};

// Async thunks
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (userData: UserProfileData, { rejectWithValue }) => {
    try {
      const response = await UserService.updateProfile(userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Не удалось обновить профиль');
    }
  }
);

export const changeUserPassword = createAsyncThunk(
  'auth/changeUserPassword',
  async (passwordData: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await UserService.changePassword(passwordData);
      return response.message || 'Пароль успешно изменен';
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Не удалось изменить пароль');
    }
  }
);

// The auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous actions
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.successMessage = null;
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User, token: string }>) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // updateUserProfile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user && action.payload) {
          state.user = {
            ...state.user,
            ...action.payload
          };
        }
        state.successMessage = 'Профиль успешно обновлен';
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ? String(action.payload) : 'Произошла ошибка при обновлении профиля';
      })
      
      // changeUserPassword
      .addCase(changeUserPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(changeUserPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload ? String(action.payload) : 'Пароль успешно изменен';
      })
      .addCase(changeUserPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ? String(action.payload) : 'Не удалось изменить пароль';
      });
  }
});

// Export actions
export const { logout, setCredentials, clearError, clearSuccessMessage } = authSlice.actions;

// Export selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthSuccessMessage = (state: RootState) => state.auth.successMessage;

export default authSlice.reducer;