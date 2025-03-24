import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import axios from 'axios';
import MockService from '../../services/mock.service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

// Types
export interface WeekdayPreference {
  dayOfWeek: string;
  shiftPreference: string | null;
}

export interface ExactDatePreference {
  exactDate: string;
  startTime: string;
  endTime: string;
}

export interface MonthOption {
  id: number;
  monthName: string; 
  monthNumber: number;
  year: number;
  targetHours: number;
}

export interface SchedulingPreference {
  id?: number;
  employeeId?: number;
  targetMonth: string;
  targetYear: number;
  weekdayPreferences: WeekdayPreference[];
  exactDatePreferences: ExactDatePreference[];
}

interface PreferenceState {
  availableMonths: MonthOption[];
  currentPreference: SchedulingPreference | null;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// Initial state
const initialState: PreferenceState = {
  availableMonths: [],
  currentPreference: null,
  isLoading: false,
  error: null,
  success: false
};

// Async thunks
// Найдите thunk fetchAvailableMonths и измените его:

export const fetchAvailableMonths = createAsyncThunk(
  'preference/fetchAvailableMonths',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/preferences/available-months`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Не удалось загрузить доступные месяцы');
    }
  }
);

export const fetchPreference = createAsyncThunk(
  'preference/fetchPreference',
  async (monthId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/preferences/${monthId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch preference');
    }
  }
);

export const submitPreference = createAsyncThunk(
  'preference/submitPreference',
  async ({ monthId, preference }: { monthId: string, preference: SchedulingPreference }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/preferences/${monthId}`, preference, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to submit preference');
    }
  }
);

export const updatePreference = createAsyncThunk(
  'preference/updatePreference',
  async ({ monthId, preference }: { monthId: string, preference: SchedulingPreference }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/preferences/${monthId}`, preference, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update preference');
    }
  }
);

// The preference slice
const preferenceSlice = createSlice({
  name: 'preference',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setCurrentPreference: (state, action: PayloadAction<SchedulingPreference>) => {
      state.currentPreference = action.payload;
    },
    updateWeekdayPreference: (state, action: PayloadAction<WeekdayPreference>) => {
      if (state.currentPreference) {
        const index = state.currentPreference.weekdayPreferences.findIndex(
          (pref) => pref.dayOfWeek === action.payload.dayOfWeek
        );
        
        if (index !== -1) {
          state.currentPreference.weekdayPreferences[index] = action.payload;
        } else {
          state.currentPreference.weekdayPreferences.push(action.payload);
        }
      }
    },
    addExactDatePreference: (state, action: PayloadAction<ExactDatePreference>) => {
      if (state.currentPreference) {
        state.currentPreference.exactDatePreferences.push(action.payload);
      }
    },
    removeExactDatePreference: (state, action: PayloadAction<number>) => {
      if (state.currentPreference) {
        state.currentPreference.exactDatePreferences = 
          state.currentPreference.exactDatePreferences.filter((_, index) => index !== action.payload);
      }
    },
    resetCurrentPreference: (state) => {
      state.currentPreference = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchAvailableMonths
      .addCase(fetchAvailableMonths.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableMonths.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableMonths = action.payload;
      })
      .addCase(fetchAvailableMonths.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // fetchPreference
      .addCase(fetchPreference.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPreference.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPreference = action.payload;
      })
      .addCase(fetchPreference.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.currentPreference = null;
      })
      
      // submitPreference
      .addCase(submitPreference.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitPreference.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPreference = action.payload;
        state.success = true;
      })
      .addCase(submitPreference.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      
      // updatePreference
      .addCase(updatePreference.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updatePreference.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPreference = action.payload;
        state.success = true;
      })
      .addCase(updatePreference.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  }
});

// Export actions
export const { 
  clearError, 
  clearSuccess, 
  setCurrentPreference, 
  updateWeekdayPreference,
  addExactDatePreference,
  removeExactDatePreference,
  resetCurrentPreference
} = preferenceSlice.actions;

// Export selectors
export const selectAvailableMonths = (state: RootState) => state.preference.availableMonths;
export const selectCurrentPreference = (state: RootState) => state.preference.currentPreference;
export const selectPreferenceLoading = (state: RootState) => state.preference.isLoading;
export const selectPreferenceError = (state: RootState) => state.preference.error;
export const selectPreferenceSuccess = (state: RootState) => state.preference.success;

export default preferenceSlice.reducer;