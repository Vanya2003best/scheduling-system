import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { store } from './store';

// Components
import LoginForm from './components/auth/LoginForm';
import MainLayout from './components/layout/MainLayout';
import PreferenceSubmission from './components/employee/PreferenceSubmission';
import ScheduleViewer from './components/employee/ScheduleViewer';
import AdminDashboard from './components/admin/AdminDashboard';

// Placeholder components - will be replaced with actual components later
const RegisterPage = () => <div>Register Page</div>;
const EmployeeDashboard = () => <div>Employee Dashboard</div>;
const NotFound = () => <div>404 - Page Not Found</div>;

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2D6CA5',
      light: '#4F8BC7',
      dark: '#1A4F80',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#D35400',
      light: '#E67E22',
      dark: '#A04000',
      contrastText: '#FFFFFF'
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF'
    }
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
  },
  shape: {
    borderRadius: 8
  }
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<EmployeeDashboard />} />
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="preferences" element={<PreferenceSubmission />} />
              <Route path="schedule" element={<ScheduleViewer />} />
              
              {/* Admin routes */}
              <Route path="admin/dashboard" element={<AdminDashboard />} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;