// src/services/mock.service.ts

import { MonthOption } from '../store/slices/preferenceSlice';

// Моковые данные для доступных месяцев
const availableMonths: MonthOption[] = [
  {
    id: 1,
    monthName: 'Январь',
    monthNumber: 1,
    year: 2025,
    targetHours: 168
  },
  {
    id: 2,
    monthName: 'Февраль',
    monthNumber: 2,
    year: 2025,
    targetHours: 160
  },
  {
    id: 3,
    monthName: 'Март',
    monthNumber: 3,
    year: 2025,
    targetHours: 176
  },
  {
    id: 4,
    monthName: 'Апрель',
    monthNumber: 4,
    year: 2025,
    targetHours: 168
  }
];

const MockService = {
  fetchAvailableMonths: () => {
    return new Promise<MonthOption[]>((resolve) => {
      // Имитация задержки сети
      setTimeout(() => {
        resolve(availableMonths);
      }, 500);
    });
  }
};

export default MockService;