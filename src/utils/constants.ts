// Days of week
export const DAYS_OF_WEEK = [
  { value: 'Poniedziałek', label: 'Poniedziałek' },
  { value: 'Wtorek', label: 'Wtorek' },
  { value: 'Środa', label: 'Środa' },
  { value: 'Czwartek', label: 'Czwartek' },
  { value: 'Piątek', label: 'Piątek' },
  { value: 'Sobota', label: 'Sobota' },
  { value: 'Niedziela', label: 'Niedziela' }
];

// Shift definitions
export const SHIFT_DEFINITIONS = [
  { value: 'Pierwsza zmiana', label: 'Pierwsza zmiana (07:00-15:00)', startTime: '07:00', endTime: '15:00' },
  { value: 'Druga zmiana', label: 'Druga zmiana (15:00-23:00)', startTime: '15:00', endTime: '23:00' },
  { value: 'Nocka', label: 'Nocka (22:00-06:00)', startTime: '22:00', endTime: '06:00', crossesMidnight: true },
  { value: null, label: 'Dzień wolny' }
];

// Utility functions
export const getShiftByValue = (value: string | null) => {
  return SHIFT_DEFINITIONS.find(shift => shift.value === value);
};

// Month names
export const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

// Time ranges for validation
export const TIME_RANGES = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});