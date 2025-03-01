import { DAYS_OF_WEEK, MONTH_NAMES } from './constants';

// Format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Parse a date string in format YYYY-MM-DD
export const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};

// Get the day of week name for a given date
export const getDayOfWeek = (date: Date): string => {
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  // Convert to our days of week array (which is 0 = Monday, etc.)
  const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  return DAYS_OF_WEEK[adjustedIndex].value;
};

// Calculate the number of days in a month
export const getDaysInMonth = (year: number, month: number): number => {
  // month is 1-based in this function
  return new Date(year, month, 0).getDate();
};

// Generate array of all dates in a month
export const getDatesInMonth = (year: number, month: number): Date[] => {
  // month is 1-based in this function
  const daysInMonth = getDaysInMonth(year, month);
  const dates: Date[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month - 1, day));
  }
  
  return dates;
};

// Calculate shift duration in hours
export const calculateShiftDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let duration = (endHour - startHour) + (endMinute - startMinute) / 60;
  
  // If negative, the shift crosses midnight
  if (duration < 0) {
    duration += 24;
  }
  
  return duration;
};

// Format a date to display the day of week and date
export const formatDateWithDayOfWeek = (date: Date): string => {
  const dayOfWeek = getDayOfWeek(date);
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  
  return `${dayOfWeek}, ${day} ${month}`;
};

// Check if a preference is fixed (exact date and time)
export const isFixedPreference = (preference: any): boolean => {
  return preference && preference.exactDate && preference.startTime && preference.endTime;
};