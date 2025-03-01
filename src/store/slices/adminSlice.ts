import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// Types
export interface Employee {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  hireDate: string;
  email: string;
}

export interface ScheduleGenerationParams {
  monthId: number;
  options?: {
    useExistingAsBase?: boolean;
    prioritizeFixedShifts?: boolean;
    maximizePreferenceSatisfaction?: boolean;
  };
}

export interface StaffingRequirement {
  id: number;
  dayOfWeek: string;
  hourOfDay: string;
  requiredEmployees: number;
}

export interface MonthlyHours {
  id: number;
  monthName: string;
  monthNumber: number;
  year: number;
  targetHours: number;
}

export interface GenerationJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result: any;
  error: string | null;
  startTime: string;
  endTime: string | null;
}

interface AdminState {
  employees: Employee[];
  staffingRequirements: StaffingRequirement[];
  monthlyHours: MonthlyHours[];
  currentJob: GenerationJob | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

// Initial state
const initialState: AdminState = {
  employees: [],
  staffingRequirements: [],
  monthlyHours: [],
  currentJob: null,
  isLoading: false,
  error: null,
  successMessage: null
};

// Async thunks
export const fetchEmployees = createAsyncThunk(
  'admin/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/employees`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch employees');
    }
  }
);

export const fetchStaffingRequirements = createAsyncThunk(
  'admin/fetchStaffingRequirements',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/staffing-requirements`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch staffing requirements');
    }
  }
);

export const updateStaffingRequirements = createAsyncThunk(
  'admin/updateStaffingRequirements',
  async (requirements: StaffingRequirement[], { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/admin/staffing-requirements`, { requirements }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update staffing requirements');
    }
  }
);

export const fetchMonthlyHours = createAsyncThunk(
  'admin/fetchMonthlyHours',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/monthly-hours`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch monthly hours');
    }
  }
);

export const updateMonthlyHours = createAsyncThunk(
  'admin/updateMonthlyHours',
  async (params: { year: number, monthNumber: number, targetHours: number }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const { year, monthNumber, targetHours } = params;
      const response = await axios.put(`${API_URL}/admin/monthly-hours/${year}/${monthNumber}`, 
        { targetHours },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update monthly hours');
    }
  }
);

export const generateSchedule = createAsyncThunk(
  'admin/generateSchedule',
  async (params: ScheduleGenerationParams, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/admin/schedules/${params.monthId}/generate`, 
        { options: params.options },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to generate schedule');
    }
  }
);

export const publishSchedule = createAsyncThunk(
  'admin/publishSchedule',
  async (monthId: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/admin/schedules/${monthId}/publish`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to publish schedule');
    }
  }
);

export const checkJobStatus = createAsyncThunk(
  'admin/checkJobStatus',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to check job status');
    }
  }
);

// The admin slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearCurrentJob: (state) => {
      state.currentJob = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchEmployees
      .addCase(fetchEmployees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // fetchStaffingRequirements
      .addCase(fetchStaffingRequirements.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStaffingRequirements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staffingRequirements = action.payload;
      })
      .addCase(fetchStaffingRequirements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // updateStaffingRequirements
      .addCase(updateStaffingRequirements.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateStaffingRequirements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staffingRequirements = action.payload;
        state.successMessage = 'Staffing requirements updated successfully';
      })
      .addCase(updateStaffingRequirements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // fetchMonthlyHours
      .addCase(fetchMonthlyHours.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyHours.fulfilled, (state, action) => {
        state.isLoading = false;
        state.monthlyHours = action.payload;
      })
      .addCase(fetchMonthlyHours.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // updateMonthlyHours
      .addCase(updateMonthlyHours.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateMonthlyHours.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the specific month in the array
        const updatedMonth = action.payload;
        const index = state.monthlyHours.findIndex(
          m => m.year === updatedMonth.year && m.monthNumber === updatedMonth.monthNumber
        );
        if (index !== -1) {
          state.monthlyHours[index] = updatedMonth;
        } else {
          state.monthlyHours.push(updatedMonth);
        }
        state.successMessage = 'Monthly hours updated successfully';
      })
      .addCase(updateMonthlyHours.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // generateSchedule
      .addCase(generateSchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentJob = action.payload;
      })
      .addCase(generateSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // publishSchedule
      .addCase(publishSchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(publishSchedule.fulfilled, (state) => {
        state.isLoading = false;
        state.successMessage = 'Schedule published successfully';
      })
      .addCase(publishSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // checkJobStatus
      .addCase(checkJobStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkJobStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentJob = action.payload;
      })
      .addCase(checkJobStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

// Export actions
export const { clearError, clearSuccessMessage, clearCurrentJob } = adminSlice.actions;

// Export selectors
export const selectEmployees = (state: RootState) => state.admin.employees;
export const selectStaffingRequirements = (state: RootState) => state.admin.staffingRequirements;
export const selectMonthlyHours = (state: RootState) => state.admin.monthlyHours;
export const selectCurrentJob = (state: RootState) => state.admin.currentJob;
export const selectAdminLoading = (state: RootState) => state.admin.isLoading;
export const selectAdminError = (state: RootState) => state.admin.error;
export const selectAdminSuccessMessage = (state: RootState) => state.admin.successMessage;

export default adminSlice.reducer;