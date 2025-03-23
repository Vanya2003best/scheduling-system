// SchedulingAlgorithm.ts

import { Employee } from '../models/Employee';
import { Preference } from '../models/Preference';
import { StaffingRequirement } from '../models/StaffingRequirement';
import { Schedule, ScheduleEntry } from '../models/Schedule';

export class SchedulingAlgorithm {
  /**
   * Генерирует расписание на основе предпочтений сотрудников и требований к персоналу
   */
  public static generateSchedule(
    monthId: number,
    employees: Employee[],
    preferences: Preference[],
    requirements: StaffingRequirement[],
    options: {
      useExistingAsBase?: boolean;
      prioritizeFixedShifts?: boolean;
      maximizePreferenceSatisfaction?: boolean;
    } = {}
  ): Schedule {
    // 1. Создаем пустое расписание для месяца
    const schedule = this.initializeSchedule(monthId);
    
    // 2. Сначала распределяем фиксированные смены (которые нельзя двигать)
    if (options.prioritizeFixedShifts !== false) {
      this.assignFixedShifts(schedule, employees, preferences);
    }
    
    // 3. Затем распределяем гибкие смены на основе предпочтений
    this.assignFlexibleShifts(schedule, employees, preferences, requirements);
    
    // 4. Проверяем и корректируем, чтобы обеспечить необходимый уровень персонала
    this.adjustForStaffingRequirements(schedule, requirements);
    
    // 5. Оптимизируем расписание для максимального удовлетворения предпочтений
    if (options.maximizePreferenceSatisfaction !== false) {
      this.optimizeSchedule(schedule, preferences);
    }
    
    // 6. Подсчитываем часы и дополнительную статистику
    this.calculateStatistics(schedule);
    
    return schedule;
  }
  
  /**
   * Инициализирует пустое расписание на основе данных о месяце
   */
  private static initializeSchedule(monthId: number): Schedule {
    // Получаем информацию о месяце из базы данных
    const monthInfo = this.getMonthInfo(monthId);
    
    // Создаем пустые записи для каждого дня месяца
    const entries: ScheduleEntry[] = [];
    const daysInMonth = new Date(monthInfo.year, monthInfo.monthNumber, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthInfo.year, monthInfo.monthNumber - 1, day);
      const dayOfWeek = this.getDayOfWeekName(date);
      
      entries.push({
        id: 0, // Будет назначено базой данных
        scheduleDate: date.toISOString().split('T')[0],
        dayOfWeek,
        startTime: null,
        endTime: null,
        isDayOff: true, // По умолчанию - выходной
        isFixedShift: false,
        shiftDurationHours: 0
      });
    }
    
    return {
      id: 0, // Будет назначено базой данных
      monthName: monthInfo.monthName,
      monthNumber: monthInfo.monthNumber,
      year: monthInfo.year,
      status: 'draft',
      entries,
      summary: {
        totalHours: 0,
        weeklyHours: [],
        fixedShifts: 0,
        flexibleShifts: 0,
        daysOff: daysInMonth
      }
    };
  }
  
  /**
   * Распределяет фиксированные смены, которые нельзя изменять
   */
  private static assignFixedShifts(
    schedule: Schedule,
    employees: Employee[],
    preferences: Preference[]
  ): void {
    // Перебираем всех сотрудников и их фиксированные предпочтения
    employees.forEach(employee => {
      const employeePreference = preferences.find(p => p.employeeId === employee.id);
      
      if (!employeePreference) return;
      
      // Обрабатываем фиксированные предпочтения по конкретным датам
      employeePreference.exactDatePreferences.forEach(fixedPref => {
        const entryIndex = schedule.entries.findIndex(
          entry => entry.scheduleDate === fixedPref.exactDate
        );
        
        if (entryIndex === -1) return;
        
        // Назначаем фиксированную смену
        const entry = schedule.entries[entryIndex];
        schedule.entries[entryIndex] = {
          ...entry,
          startTime: fixedPref.startTime,
          endTime: fixedPref.endTime,
          isDayOff: false,
          isFixedShift: true,
          // Рассчитываем продолжительность смены
          shiftDurationHours: this.calculateShiftDuration(fixedPref.startTime, fixedPref.endTime)
        };
        
        // Обновляем статистику
        schedule.summary.fixedShifts++;
        schedule.summary.daysOff--;
      });
    });
  }
  
  /**
   * Распределяет гибкие смены на основе предпочтений и требований
   */
  private static assignFlexibleShifts(
    schedule: Schedule,
    employees: Employee[],
    preferences: Preference[],
    requirements: StaffingRequirement[]
  ): void {
    // Группируем требования по дням недели для быстрого доступа
    const requirementsByDay = this.groupRequirementsByDay(requirements);
    
    // Для каждого дня в расписании
    schedule.entries.forEach((entry, index) => {
      // Пропускаем дни, которые уже заняты фиксированными сменами
      if (!entry.isDayOff) return;
      
      const dayOfWeek = entry.dayOfWeek;
      const date = new Date(entry.scheduleDate);
      
      // Получаем требования к персоналу на этот день
      const dayRequirements = requirementsByDay[dayOfWeek] || [];
      
      // Если нет требований на этот день, оставляем выходной
      if (dayRequirements.length === 0) return;
      
      // Находим сотрудников, которые предпочитают работать в этот день недели
      const availableEmployees = this.findAvailableEmployees(
        employees, 
        preferences, 
        dayOfWeek,
        date,
        schedule
      );
      
      // Если нет доступных сотрудников, оставляем день нераспределенным
      if (availableEmployees.length === 0) return;
      
      // Выбираем смену из предпочтений сотрудника
      const employee = this.selectBestEmployeeForDay(availableEmployees, preferences, dayOfWeek);
      if (!employee) return;
      
      const employeePreference = preferences.find(p => p.employeeId === employee.id);
      if (!employeePreference) return;
      
      const weekdayPref = employeePreference.weekdayPreferences.find(
        p => p.dayOfWeek === dayOfWeek
      );
      
      if (!weekdayPref || !weekdayPref.shiftPreference) return;
      
      // Получаем информацию о смене
      const shift = this.getShiftByValue(weekdayPref.shiftPreference);
      if (!shift) return;
      
      // Назначаем гибкую смену
      schedule.entries[index] = {
        ...entry,
        startTime: shift.startTime,
        endTime: shift.endTime,
        isDayOff: false,
        isFixedShift: false,
        shiftDurationHours: this.calculateShiftDuration(shift.startTime, shift.endTime)
      };
      
      // Обновляем статистику
      schedule.summary.flexibleShifts++;
      schedule.summary.daysOff--;
    });
  }
  
  /**
   * Корректирует расписание, чтобы обеспечить необходимое количество персонала
   */
  private static adjustForStaffingRequirements(
    schedule: Schedule,
    requirements: StaffingRequirement[]
  ): void {
    // Логика корректировки расписания для удовлетворения требований к персоналу
    // Здесь может быть сложный алгоритм оптимизации
  }
  
  /**
   * Оптимизирует расписание для максимального удовлетворения предпочтений
   */
  private static optimizeSchedule(
    schedule: Schedule,
    preferences: Preference[]
  ): void {
    // Дополнительная оптимизация для максимального удовлетворения предпочтений
    // Можно использовать генетические алгоритмы или другие методы оптимизации
  }
  
  /**
   * Подсчитывает часы и дополнительную статистику для расписания
   */
  private static calculateStatistics(schedule: Schedule): void {
    let totalHours = 0;
    const weeklyHours: { weekNumber: number; hours: number }[] = [];
    
    // Инициализируем счетчики для каждой недели
    const weeksInMonth = Math.ceil(schedule.entries.length / 7);
    for (let i = 0; i < weeksInMonth; i++) {
      weeklyHours.push({ weekNumber: i, hours: 0 });
    }
    
    // Подсчитываем часы
    schedule.entries.forEach(entry => {
      if (entry.isDayOff) return;
      
      totalHours += entry.shiftDurationHours;
      
      // Определяем номер недели
      const date = new Date(entry.scheduleDate);
      const weekNumber = Math.floor((date.getDate() - 1) / 7);
      
      // Добавляем часы в соответствующую неделю
      weeklyHours[weekNumber].hours += entry.shiftDurationHours;
    });
    
    // Обновляем сводку
    schedule.summary.totalHours = totalHours;
    schedule.summary.weeklyHours = weeklyHours;
  }
  
  // Вспомогательные методы
  
  private static getMonthInfo(monthId: number): { monthName: string; monthNumber: number; year: number } {
    // В реальном приложении здесь будет запрос к базе данных
    // Временное решение для примера
    return {
      monthName: 'Март',
      monthNumber: 3,
      year: 2025
    };
  }
  
  private static getDayOfWeekName(date: Date): string {
    const daysOfWeek = [
      'Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'
    ];
    return daysOfWeek[date.getDay()];
  }
  
  private static calculateShiftDuration(startTime: string, endTime: string): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let duration = (endHour - startHour) + (endMinute - startMinute) / 60;
    
    // Если смена переходит через полночь
    if (duration < 0) {
      duration += 24;
    }
    
    return duration;
  }
  
  private static groupRequirementsByDay(requirements: StaffingRequirement[]): Record<string, StaffingRequirement[]> {
    const result: Record<string, StaffingRequirement[]> = {};
    
    requirements.forEach(req => {
      if (!result[req.dayOfWeek]) {
        result[req.dayOfWeek] = [];
      }
      result[req.dayOfWeek].push(req);
    });
    
    return result;
  }
  
  private static findAvailableEmployees(
    employees: Employee[],
    preferences: Preference[],
    dayOfWeek: string,
    date: Date,
    schedule: Schedule
  ): Employee[] {
    // Отфильтровываем сотрудников, которые доступны для работы в этот день
    return employees.filter(employee => {
      const employeePreference = preferences.find(p => p.employeeId === employee.id);
      if (!employeePreference) return false;
      
      // Проверяем, нет ли у сотрудника уже назначенной смены на этот день
      const hasAssignedShift = schedule.entries.some(entry => 
        !entry.isDayOff && 
        entry.scheduleDate === date.toISOString().split('T')[0] &&
        entry.employeeId === employee.id
      );
      
      if (hasAssignedShift) return false;
      
      // Проверяем, есть ли у сотрудника предпочтение работать в этот день недели
      const weekdayPref = employeePreference.weekdayPreferences.find(
        p => p.dayOfWeek === dayOfWeek
      );
      
      return weekdayPref && weekdayPref.shiftPreference !== null;
    });
  }
  
  private static selectBestEmployeeForDay(
    availableEmployees: Employee[],
    preferences: Preference[],
    dayOfWeek: string
  ): Employee | null {
    // Здесь можно реализовать сложную логику выбора лучшего сотрудника
    // Например, выбрать сотрудника с наименьшим количеством назначенных часов
    // или с наивысшим приоритетом для данной смены
    
    // Для простоты пока просто берем первого доступного сотрудника
    return availableEmployees.length > 0 ? availableEmployees[0] : null;
  }
  
  private static getShiftByValue(shiftValue: string): { startTime: string; endTime: string } | null {
    const shifts = [
      { value: 'Pierwsza zmiana', startTime: '07:00', endTime: '15:00' },
      { value: 'Druga zmiana', startTime: '15:00', endTime: '23:00' },
      { value: 'Nocka', startTime: '22:00', endTime: '06:00' }
    ];
    
    return shifts.find(shift => shift.value === shiftValue) || null;
  }
}
