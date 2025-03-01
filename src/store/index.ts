import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import preferenceReducer from './slices/preferenceSlice';
import scheduleReducer from './slices/scheduleSlice';
import adminReducer from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    preference: preferenceReducer,
    schedule: scheduleReducer,
    admin: adminReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;