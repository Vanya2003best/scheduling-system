import api from './api';

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export const PasswordResetService = {
  forgotPassword: async (data: ForgotPasswordRequest) => {
    try {
      const response = await api.post('/auth/forgot-password', data);
      return response.data;
    } catch (error: any) {
      // Extract meaningful error message
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to send password reset instructions';
      
      throw new Error(errorMessage);
    }
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    try {
      const response = await api.post('/auth/reset-password', data);
      return response.data;
    } catch (error: any) {
      // Extract meaningful error message
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to reset password';
      
      throw new Error(errorMessage);
    }
  }
};