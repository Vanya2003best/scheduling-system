/**
 * Scheduling Service
 * Implements the core scheduling algorithm for generating and optimizing employee work schedules
 */

const { Op } = require('sequelize');
const { sequelize } = require('../models');

/**
 * Generates a work schedule for employees based on their preferences and system constraints
 * @param {string} targetMonth - Month name (e.g., "Styczeń")
 * @param {number} targetYear - Year (e.g., 2025)
 * @param {boolean} overrideExisting - Whether to override an existing schedule
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Generated schedule
 */
async function generateSchedule(targetMonth, targetYear, overrideExisting = false, options = {}) {
  try {
    // Start a transaction to ensure data consistency
    const result = await sequelize.transaction(async (transaction) => {
      // Get all necessary data within transaction
      const { 
        monthlyHoursTarget, 
        staffingRequirements, 
        preferences,
        employees,
        existingSchedule 
      } = await fetchRequiredData(targetMonth, targetYear, transaction);
      
      // Check if schedule already exists and handle according to overrideExisting
      if (existingSchedule && !overrideExisting) {
        throw new Error('Schedule already exists for this month. Set overrideExisting to true to replace it.');
      }
      
      // 1. Generate initial schedule based on preferences
      let schedule = await generateInitialSchedule(employees, preferences, targetMonth, targetYear);
      
      // 2. Adjust weekly hours to meet 60-hour limit
      schedule = await adjustWeeklyHours(schedule);
      
      // 3. Adjust monthly hours to meet target
      schedule = await adjustMonthlyHours(schedule, monthlyHoursTarget);
      
      // 4. Enforce staffing requirements
      schedule = await enforceStaffingRequirements(schedule, staffingRequirements);
      
      // 5. Final pass to ensure monthly hours target is met
      schedule = await adjustMonthlyHours(schedule, monthlyHoursTarget);
      
      // 6. Save the generated schedule to the database
      const savedSchedule = await saveSchedule(schedule, targetMonth, targetYear, transaction);
      
      return {
        scheduleId: savedSchedule.id,
        monthName: targetMonth,
        year: targetYear,
        employeeCount: employees.length,
        totalHours: calculateTotalHours(schedule),
        status: 'draft'
      };
    });
    
    return result;
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw error;
  }
}

/**
 * Fetches all required data for scheduling
 * @param {string} targetMonth - Month name
 * @param {number} targetYear - Year
 * @param {Transaction} transaction - Sequelize transaction
 * @returns {Promise<Object>} Object containing all required data
 */
async function fetchRequiredData(targetMonth, targetYear, transaction) {
  const { 
    MonthlyWorkingHours, 
    StaffingRequirements, 
    Employee, 
    SchedulingPreference,
    WeekdayPreference,
    ExactDatePreference,
    GeneratedSchedule
  } = require('../models');
  
  // Get month number from month name
  const monthNumberMap = {
    "Styczeń": 1, "Luty": 2, "Marzec": 3, "Kwiecień": 4,
    "Maj": 5, "Czerwiec": 6, "Lipiec": 7, "Sierpień": 8,
    "Wrzesień": 9, "Październik": 10, "Listopad": 11, "Grudzień": 12
  };
  const monthNumber = monthNumberMap[targetMonth];
  
  // Get monthly hours target
  const monthlyHours = await MonthlyWorkingHours.findOne({
    where: {
      month_name: targetMonth,
      year: targetYear
    },
    transaction
  });
  
  if (!monthlyHours) {
    throw new Error(`Monthly hours not defined for ${targetMonth} ${targetYear}`);
  }
  
  // Get staffing requirements
  const staffingReqs = await StaffingRequirements.findAll({
    transaction
  });
  
  // Convert to a more usable format: { dayOfWeek: { hour: requiredStaff } }
  const staffingRequirements = staffingReqs.reduce((acc, req) => {
    if (!acc[req.day_of_week]) {
      acc[req.day_of_week] = {};
    }
    acc[req.day_of_week][req.hour_of_day] = req.required_employees;
    return acc;
  }, {});
  
  // Get employees
  const employees = await Employee.findAll({
    include: [
      {
        association: 'user',
        where: {
          is_active: true
        },
        attributes: ['id', 'email']
      }
    ],
    transaction
  });
  
  // Get employee preferences
  const preferences = new Map();
  
  for (const employee of employees) {
    const employeePrefs = await SchedulingPreference.findOne({
      where: {
        employee_id: employee.id,
        target_month: targetMonth,
        target_year: targetYear
      },
      include: [
        {
          model: WeekdayPreference,
          as: 'weekdayPreferences'
        },
        {
          model: ExactDatePreference,
          as: 'exactDatePreferences'
        }
      ],
      transaction
    });
    
    if (employeePrefs) {
      preferences.set(employee.id, employeePrefs);
    }
  }
  
  // Check for existing schedule
  const existingSchedule = await GeneratedSchedule.findOne({
    where: {
      month_name: targetMonth,
      year: targetYear
    },
    transaction
  });
  
  return {
    monthlyHoursTarget: monthlyHours.target_hours,
    staffingRequirements,
    preferences,
    employees,
    existingSchedule
  };
}

/**
 * Generate initial schedule based on employee preferences
 * @param {Array} employees - List of employees
 * @param {Map} preferences - Map of employee preferences
 * @param {string} targetMonth - Target month name
 * @param {number} targetYear - Target year
 * @returns {Map} Initial schedule
 */
async function generateInitialSchedule(employees, preferences, targetMonth, targetYear) {
  const schedule = new Map();
  
  // Month number mapping
  const monthNumberMap = {
    "Styczeń": 1, "Luty": 2, "Marzec": 3, "Kwiecień": 4,
    "Maj": 5, "Czerwiec": 6, "Lipiec": 7, "Sierpień": 8,
    "Wrzesień": 9, "Październik": 10, "Listopad": 11, "Grudzień": 12
  };
  const monthNumber = monthNumberMap[targetMonth];
  
  // Standard shift mappings
  const shiftDefinitions = {
    "Pierwsza zmiana": { startTime: "07:00", endTime: "15:00" },
    "Druga zmiana": { startTime: "15:00", endTime: "23:00" },
    "Nocka": { startTime: "22:00", endTime: "06:00" }
  };
  
  // Days in month
  const daysInMonth = new Date(targetYear, monthNumber, 0).getDate();
  
  // Day of week name mapping
  const dayOfWeekNames = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
  
  // Process each employee
  for (const employee of employees) {
    const employeeSchedule = [];
    const employeePreferences = preferences.get(employee.id);
    
    // For each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(targetYear, monthNumber - 1, day);
      const dayOfWeek = dayOfWeekNames[date.getDay()];
      const formattedDate = formatDate(date);
      
      let startTime = null;
      let endTime = null;
      let isFixed = false;
      let isDayOff = true;
      
      // Check for exact date preferences (fixed dates)
      if (employeePreferences && employeePreferences.exactDatePreferences) {
        const exactPref = employeePreferences.exactDatePreferences.find(pref => {
          return new Date(pref.exact_date).getDate() === day;
        });
        
        if (exactPref) {
          startTime = exactPref.start_time;
          endTime = exactPref.end_time;
          isFixed = true;
          isDayOff = false;
        }
      }
      
      // If no exact preference, check weekday preferences
      if (!isFixed && employeePreferences && employeePreferences.weekdayPreferences) {
        const weekdayPref = employeePreferences.weekdayPreferences.find(pref => 
          pref.day_of_week === dayOfWeek
        );
        
        if (weekdayPref && weekdayPref.shift_preference) {
          const shift = shiftDefinitions[weekdayPref.shift_preference];
          if (shift) {
            startTime = shift.startTime;
            endTime = shift.endTime;
            isDayOff = false;
          }
        }
      }
      
      // Add this day to the employee's schedule
      employeeSchedule.push({
        date: formattedDate,
        dayOfWeek,
        startTime,
        endTime,
        isFixed,
        isDayOff
      });
    }
    
    schedule.set(employee.id, employeeSchedule);
  }
  
  return schedule;
}

/**
 * Adjust weekly hours to meet 60-hour limit
 * @param {Map} schedule - Schedule to adjust
 * @param {number} weeklyHourLimit - Weekly hour limit (default: 60)
 * @returns {Map} Adjusted schedule
 */
async function adjustWeeklyHours(schedule, weeklyHourLimit = 60) {
  // For each employee's schedule
  for (const [employeeId, employeeSchedule] of schedule.entries()) {
    // Group days by week
    const weeks = groupByWeek(employeeSchedule);
    
    // For each week
    for (const week of weeks) {
      // Calculate total hours for the week
      let weeklyHours = calculateWeeklyHours(week);
      
      // If weekly hours exceed limit, adjust
      while (weeklyHours > weeklyHourLimit) {
        // Find best candidates for adjustment (non-fixed shifts)
        const candidates = week
          .filter(day => !day.isFixed && !day.isDayOff)
          .map(day => ({
            day,
            hours: calculateShiftHours(day)
          }))
          .sort((a, b) => b.hours - a.hours); // Sort by hours descending
        
        if (candidates.length === 0) {
          // No candidates for adjustment, break the loop
          break;
        }
        
        // Choose the shift with the most hours to convert to a day off
        const candidateToAdjust = candidates[0].day;
        candidateToAdjust.startTime = null;
        candidateToAdjust.endTime = null;
        candidateToAdjust.isDayOff = true;
        
        // Recalculate weekly hours
        weeklyHours = calculateWeeklyHours(week);
      }
    }
  }
  
  return schedule;
}

/**
 * Adjust monthly hours to meet target
 * @param {Map} schedule - Schedule to adjust
 * @param {number} monthlyHoursTarget - Monthly hours target
 * @returns {Map} Adjusted schedule
 */
async function adjustMonthlyHours(schedule, monthlyHoursTarget) {
  // For each employee's schedule
  for (const [employeeId, employeeSchedule] of schedule.entries()) {
    // Calculate current monthly hours
    let currentHours = calculateMonthlyHours(employeeSchedule);
    
    // If hours exceed target, reduce them
    while (currentHours > monthlyHoursTarget) {
      // Find best candidates for adjustment (non-fixed shifts)
      const candidates = employeeSchedule
        .filter(day => !day.isFixed && !day.isDayOff)
        .map(day => ({
          day,
          hours: calculateShiftHours(day)
        }))
        .sort((a, b) => b.hours - a.hours); // Sort by hours descending
      
      if (candidates.length === 0) {
        // No candidates for adjustment, break the loop
        break;
      }
      
      // Choose the shift with the most hours to convert to a day off
      const candidateToAdjust = candidates[0].day;
      candidateToAdjust.startTime = null;
      candidateToAdjust.endTime = null;
      candidateToAdjust.isDayOff = true;
      
      // Recalculate monthly hours
      currentHours = calculateMonthlyHours(employeeSchedule);
    }
    
    // If hours are less than target, add more hours
    if (currentHours < monthlyHoursTarget) {
      // Find candidates for adding hours (current days off that are not fixed)
      const candidates = employeeSchedule
        .filter(day => !day.isFixed && day.isDayOff)
        .sort((a, b) => {
          // Sort by day of week preference (weekdays first)
          const aValue = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'].includes(a.dayOfWeek) ? 0 : 1;
          const bValue = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'].includes(b.dayOfWeek) ? 0 : 1;
          return aValue - bValue;
        });
      
      for (const candidate of candidates) {
        if (currentHours >= monthlyHoursTarget) {
          break;
        }
        
        // Default shift (8 hours)
        const defaultShiftHours = 8;
        
        if (currentHours + defaultShiftHours <= monthlyHoursTarget) {
          // Add a full shift
          candidate.startTime = "07:00";
          candidate.endTime = "15:00";
          candidate.isDayOff = false;
          
          currentHours += defaultShiftHours;
        } else {
          // Add a partial shift to exactly meet the target
          const remainingHours = monthlyHoursTarget - currentHours;
          candidate.startTime = "07:00";
          
          // Calculate end time based on remaining hours
          const endHour = 7 + remainingHours;
          const endMinutes = (endHour - Math.floor(endHour)) * 60;
          
          candidate.endTime = `${Math.floor(endHour).toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
          candidate.isDayOff = false;
          
          currentHours = monthlyHoursTarget;
        }
      }
    }
  }
  
  return schedule;
}

/**
 * Enforce staffing requirements
 * @param {Map} schedule - Schedule to adjust
 * @param {Object} staffingRequirements - Staffing requirements by day and hour
 * @returns {Map} Adjusted schedule
 */
async function enforceStaffingRequirements(schedule, staffingRequirements) {
  // Group schedules by date and hour
  const hourlyAssignments = groupByDateAndHour(schedule);
  
  // For each date and hour combination
  for (const [key, employees] of hourlyAssignments.entries()) {
    const [dateStr, hour, dayOfWeek] = key.split('_');
    
    // Get required number of employees for this day and hour
    const requiredEmployees = staffingRequirements[dayOfWeek]?.[hour];
    
    if (!requiredEmployees || employees.length <= requiredEmployees) {
      // Requirements met or no requirements defined, continue
      continue;
    }
    
    // Too many employees assigned, need to reduce
    const excessCount = employees.length - requiredEmployees;
    
    // Filter to employees with non-fixed shifts
    const adjustableCandidates = employees.filter(employeeId => {
      const employeeSchedule = schedule.get(parseInt(employeeId));
      const daySchedule = employeeSchedule.find(day => day.date === dateStr);
      
      return daySchedule && !daySchedule.isFixed;
    });
    
    // If not enough adjustable candidates, we can't meet requirements
    if (adjustableCandidates.length < excessCount) {
      console.warn(`Cannot meet staffing requirements for ${dayOfWeek} at ${hour}`);
      continue;
    }
    
    // Randomly select employees to remove from this shift
    const selectedForRemoval = getRandomSubset(adjustableCandidates, excessCount);
    
    // Update schedules for these employees
    for (const employeeId of selectedForRemoval) {
      const employeeSchedule = schedule.get(parseInt(employeeId));
      const dayToAdjust = employeeSchedule.find(day => day.date === dateStr);
      
      dayToAdjust.startTime = null;
      dayToAdjust.endTime = null;
      dayToAdjust.isDayOff = true;
    }
  }
  
  return schedule;
}

/**
 * Save the generated schedule to the database
 * @param {Map} schedule - Generated schedule
 * @param {string} targetMonth - Target month name
 * @param {number} targetYear - Target year
 * @param {Transaction} transaction - Sequelize transaction
 * @returns {Promise<Object>} Saved schedule
 */
async function saveSchedule(schedule, targetMonth, targetYear, transaction) {
  const { 
    GeneratedSchedule, 
    ScheduleEntry, 
    EmployeeMonthlyHours,
    EmployeeWeeklyHours 
  } = require('../models');
  
  // Month number mapping
  const monthNumberMap = {
    "Styczeń": 1, "Luty": 2, "Marzec": 3, "Kwiecień": 4,
    "Maj": 5, "Czerwiec": 6, "Lipiec": 7, "Sierpień": 8,
    "Wrzesień": 9, "Październik": 10, "Listopad": 11, "Grudzień": 12
  };
  const monthNumber = monthNumberMap[targetMonth];
  
  // Create or update the generated schedule
  const [generatedSchedule, created] = await GeneratedSchedule.findOrCreate({
    where: {
      month_name: targetMonth,
      year: targetYear
    },
    defaults: {
      month_number: monthNumber,
      status: 'draft',
      generation_timestamp: new Date()
    },
    transaction
  });
  
  if (!created) {
    // Update existing schedule
    generatedSchedule.generation_timestamp = new Date();
    generatedSchedule.status = 'draft';
    await generatedSchedule.save({ transaction });
    
    // Delete existing entries for this schedule
    await ScheduleEntry.destroy({
      where: {
        schedule_id: generatedSchedule.id
      },
      transaction
    });
    
    // Delete existing hourly records
    await EmployeeMonthlyHours.destroy({
      where: {
        schedule_id: generatedSchedule.id
      },
      transaction
    });
    
    await EmployeeWeeklyHours.destroy({
      where: {
        schedule_id: generatedSchedule.id
      },
      transaction
    });
  }
  
  // Add schedule entries
  for (const [employeeId, employeeSchedule] of schedule.entries()) {
    // Calculate monthly hours for this employee
    const totalHours = calculateMonthlyHours(employeeSchedule);
    
    // Create monthly hours record
    await EmployeeMonthlyHours.create({
      schedule_id: generatedSchedule.id,
      employee_id: employeeId,
      total_hours: totalHours
    }, { transaction });
    
    // Group by week and create weekly hours records
    const weeks = groupByWeek(employeeSchedule);
    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      const weeklyHours = calculateWeeklyHours(week);
      const startDate = new Date(week[0].date);
      const endDate = new Date(week[week.length - 1].date);
      
      await EmployeeWeeklyHours.create({
        schedule_id: generatedSchedule.id,
        employee_id: employeeId,
        week_number: i + 1,
        start_date: startDate,
        end_date: endDate,
        total_hours: weeklyHours
      }, { transaction });
    }
    
    // Create entries for each day
    for (const day of employeeSchedule) {
      await ScheduleEntry.create({
        schedule_id: generatedSchedule.id,
        employee_id: employeeId,
        schedule_date: new Date(day.date),
        day_of_week: day.dayOfWeek,
        start_time: day.startTime,
        end_time: day.endTime,
        is_day_off: day.isDayOff,
        is_fixed_shift: day.isFixed,
        shift_duration_hours: calculateShiftHours(day)
      }, { transaction });
    }
  }
  
  return generatedSchedule;
}

// Helper functions

/**
 * Calculate shift hours
 * @param {Object} shift - Shift object with startTime and endTime
 * @returns {number} Shift duration in hours
 */
function calculateShiftHours(shift) {
  if (shift.isDayOff || !shift.startTime || !shift.endTime) {
    return 0;
  }
  
  const [startHour, startMinute] = shift.startTime.split(':').map(Number);
  const [endHour, endMinute] = shift.endTime.split(':').map(Number);
  
  let hours = endHour - startHour;
  let minutes = endMinute - startMinute;
  
  if (minutes < 0) {
    hours -= 1;
    minutes += 60;
  }
  
  if (hours < 0) {
    // Shift crosses midnight
    hours += 24;
  }
  
  return hours + (minutes / 60);
}

/**
 * Calculate weekly hours
 * @param {Array} weekSchedule - Week schedule
 * @returns {number} Total hours for the week
 */
function calculateWeeklyHours(weekSchedule) {
  return weekSchedule.reduce((total, day) => total + calculateShiftHours(day), 0);
}

/**
 * Calculate monthly hours
 * @param {Array} monthSchedule - Month schedule
 * @returns {number} Total hours for the month
 */
function calculateMonthlyHours(monthSchedule) {
  return monthSchedule.reduce((total, day) => total + calculateShiftHours(day), 0);
}

/**
 * Calculate total hours for a schedule
 * @param {Map} schedule - Schedule
 * @returns {number} Total hours
 */
function calculateTotalHours(schedule) {
  let totalHours = 0;
  for (const [_, employeeSchedule] of schedule.entries()) {
    totalHours += calculateMonthlyHours(employeeSchedule);
  }
  return totalHours;
}

/**
 * Group days by week
 * @param {Array} schedule - Schedule array
 * @returns {Array} Array of week arrays
 */
function groupByWeek(schedule) {
  const weeks = [];
  let currentWeek = [];
  
  for (let i = 0; i < schedule.length; i++) {
    const day = schedule[i];
    currentWeek.push(day);
    
    // End of week or end of month
    if (new Date(day.date).getDay() === 6 || i === schedule.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  return weeks;
}

/**
 * Group schedules by date and hour
 * @param {Map} schedule - Schedule map
 * @returns {Map} Map of date_hour_dayOfWeek -> employeeIds
 */
function groupByDateAndHour(schedule) {
  const hourlyAssignments = new Map();
  
  for (const [employeeId, employeeSchedule] of schedule.entries()) {
    for (const day of employeeSchedule) {
      if (day.isDayOff || !day.startTime || !day.endTime) {
        continue;
      }
      
      const [startHour] = day.startTime.split(':').map(Number);
      const [endHour] = day.endTime.split(':').map(Number);
      
      let endHourAdjusted = endHour;
      if (endHour <= startHour) {
        // Shift crosses midnight
        endHourAdjusted += 24;
      }
      
      for (let hour = startHour; hour < endHourAdjusted; hour++) {
        const hourKey = `${hour % 24}:00`;
        const key = `${day.date}_${hourKey}_${day.dayOfWeek}`;
        
        if (!hourlyAssignments.has(key)) {
          hourlyAssignments.set(key, []);
        }
        
        hourlyAssignments.get(key).push(employeeId.toString());
      }
    }
  }
  
  return hourlyAssignments;
}

/**
 * Get random subset of array
 * @param {Array} array - Input array
 * @param {number} count - Number of elements to select
 * @returns {Array} Random subset
 */
function getRandomSubset(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = {
  generateSchedule,
  adjustWeeklyHours,
  adjustMonthlyHours,
  enforceStaffingRequirements
};