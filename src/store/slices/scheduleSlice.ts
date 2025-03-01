import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// Types
export interface ScheduleEntry {
  id: number;
  scheduleDate: string;
  dayOfWeek: string;
  startTime: string | null;
  endTime: string | null;
  isDayOff: boolean;
  isFixedShift: boolean;
  shiftDurationHours: number;
}

export interface ScheduleSummary {
  totalHours: number;
  weeklyHours: { weekNumber: number, hours: number }[];
  fixedShifts: number;
  flexibleShifts: number;
  daysOff: number;
}

export interface Schedule {
  id: number;
  monthName: string;
  monthNumber: number;
  year: number;
  status: 'draft' | 'published' | 'archived';
  entries: ScheduleEntry[];
  summary: ScheduleSummary;
}

export interface MonthSchedule {
  id: number;
  monthName: string;
  monthNumber: number;
  year: number;
  status: 'draft' | 'published' | 'archived';
}

interface ScheduleState {
  availableSchedules: MonthSchedule[];
  currentSchedule: Schedule | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: ScheduleState = {
  availableSchedules: [],
  currentSchedule: null,
  isLoading: false,
  error: null
};

// Async thunks
export const fetchAvailableSchedules = createAsyncThunk(
  'schedule/fetchAvailableSchedules',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/schedules`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch available schedules');
    }
  }
);

export const fetchSchedule = createAsyncThunk(
  'schedule/fetchSchedule',
  async (monthId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/schedules/${monthId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch schedule');
    }
  }
);

// The schedule slice
const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetCurrentSchedule: (state) => {
      state.currentSchedule = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchAvailableSchedules
      .addCase(fetchAvailableSchedules.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableSchedules.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableSchedules = action.payload;
      })
      .addCase(fetchAvailableSchedules.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // fetchSchedule
      .addCase(fetchSchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSchedule = action.payload;
      })
      .addCase(fetchSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.currentSchedule = null;
      });
  }
});

// Export actions
export const { clearError, resetCurrentSchedule } = scheduleSlice.actions;

// Export selectors
export const selectAvailableSchedules = (state: RootState) => state.schedule.availableSchedules;
export const selectCurrentSchedule = (state: RootState) => state.schedule.currentSchedule;
export const selectScheduleLoading = (state: RootState) => state.schedule.isLoading;
export const selectScheduleError = (state: RootState) => state.schedule.error;

export default scheduleSlice.reducer;