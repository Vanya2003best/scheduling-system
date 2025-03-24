import api from './api';

// Types
interface UserProfileData {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

const UserService = {
    updateProfile: async (userData: UserProfileData) => {
      const response = await api.put<ApiResponse>('/users/profile', userData);
      return response.data;
    },
  
    changePassword: async (passwordData: ChangePasswordData) => {
      const response = await api.put<ApiResponse>('/users/password', passwordData);
      return response.data;
    }
  };

export default UserService;