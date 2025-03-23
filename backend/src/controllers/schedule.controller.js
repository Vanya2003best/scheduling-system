/**
 * Schedule Controller
 * Handles all schedule-related operations
 */

const { GeneratedSchedule, ScheduleEntry, Employee } = require('../models');
const schedulingService = require('../services/scheduling.service');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get schedule for a specific month (employee view)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getSchedule(req, res, next) {
  try {
    const { monthId } = req.params;
    const userId = req.user.id;
    
    // Parse monthId (format: 'YYYY-MM')
    const [year, month] = monthId.split('-').map(Number);
    
    // Get month name from month number
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    const monthName = monthNames[month - 1];
    
    // Find employee record for the user
    const employee = await Employee.findOne({
      where: { userId }
    });
    
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }
    
    // Find the schedule
    const schedule = await GeneratedSchedule.findOne({
      where: {
        month_name: monthName,
        year: year,
        status: 'published' // Only return published schedules
      }
    });
    
    if (!schedule) {
      throw new ApiError(404, 'Schedule not found for this month');
    }
    
    // Get schedule entries for this employee
    const entries = await ScheduleEntry.findAll({
      where: {
        schedule_id: schedule.id,
        employee_id: employee.id
      },
      order: [['schedule_date', 'ASC']]
    });
    
    // Calculate total hours
    const totalHours = entries.reduce((sum, entry) => sum + (entry.shift_duration_hours || 0), 0);
    
    // Format the response
    const formattedEntries = entries.map(entry => ({
      date: entry.schedule_date.toISOString().split('T')[0],
      dayOfWeek: entry.day_of_week,
      startTime: entry.start_time,
      endTime: entry.end_time,
      isDayOff: entry.is_day_off,
      isFixed: entry.is_fixed_shift
    }));
    
    res.status(200).json({
      employeeId: employee.id,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      month: monthName,
      year: year,
      status: schedule.status,
      totalHours: totalHours,
      entries: formattedEntries
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all schedules (admin view)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getAllSchedules(req, res, next) {
  try {
    const schedules = await GeneratedSchedule.findAll({
      order: [['year', 'DESC'], ['month_number', 'DESC']]
    });
    
    // Format the response
    const formattedSchedules = schedules.map(schedule => ({
      id: `${schedule.year}-${schedule.month_number.toString().padStart(2, '0')}`,
      month: schedule.month_name,
      year: schedule.year,
      status: schedule.status,
      generationDate: schedule.generation_timestamp,
      publishDate: schedule.published_at
    }));
    
    res.status(200).json({ schedules: formattedSchedules });
  } catch (error) {
    next(error);
  }
}

/**
 * Get schedule details (admin view)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getScheduleDetails(req, res, next) {
  try {
    const { monthId } = req.params;
    const includeEmployees = req.query.includeEmployees === 'true';
    
    // Parse monthId (format: 'YYYY-MM')
    const [year, month] = monthId.split('-').map(Number);
    
    // Get month name from month number
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    const monthName = monthNames[month - 1];
    
    // Find the schedule
    const schedule = await GeneratedSchedule.findOne({
      where: {
        month_name: monthName,
        year: year
      }
    });
    
    if (!schedule) {
      throw new ApiError(404, 'Schedule not found for this month');
    }
    
    // Get basic statistics
    const statistics = await getScheduleStatistics(schedule.id);
    
    // Prepare response
    const response = {
      id: monthId,
      month: schedule.month_name,
      year: schedule.year,
      monthNumber: schedule.month_number,
      status: schedule.status,
      targetHours: statistics.targetHours,
      generationDate: schedule.generation_timestamp,
      publishDate: schedule.published_at,
      createdBy: schedule.created_by,
      statistics
    };
    
    // Include employee details if requested
    if (includeEmployees) {
      response.employees = await getEmployeeScheduleSummaries(schedule.id);
    }
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get employee schedule details (admin view)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getEmployeeScheduleDetails(req, res, next) {
  try {
    const { monthId, employeeId } = req.params;
    
    // Parse monthId (format: 'YYYY-MM')
    const [year, month] = monthId.split('-').map(Number);
    
    // Get month name from month number
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    const monthName = monthNames[month - 1];
    
    // Find the schedule
    const schedule = await GeneratedSchedule.findOne({
      where: {
        month_name: monthName,
        year: year
      }
    });
    
    if (!schedule) {
      throw new ApiError(404, 'Schedule not found for this month');
    }
    
    // Find the employee
    const employee = await Employee.findByPk(employeeId);
    
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }
    
    // Get schedule entries for this employee
    const entries = await ScheduleEntry.findAll({
      where: {
        schedule_id: schedule.id,
        employee_id: employeeId
      },
      order: [['schedule_date', 'ASC']]
    });
    
    if (entries.length === 0) {
      throw new ApiError(404, 'No schedule entries found for this employee');
    }
    
    // Get weekly hours
    const weeklyHours = await getWeeklyHours(schedule.id, employeeId);
    
    // Calculate total hours
    const totalHours = entries.reduce((sum, entry) => sum + (entry.shift_duration_hours || 0), 0);
    
    // Format the response
    const formattedEntries = entries.map(entry => ({
      date: entry.schedule_date.toISOString().split('T')[0],
      dayOfWeek: entry.day_of_week,
      startTime: entry.start_time,
      endTime: entry.end_time,
      isDayOff: entry.is_day_off,
      isFixed: entry.is_fixed_shift,
      hours: entry.shift_duration_hours
    }));
    
    // Get employee preferences for this month
    const preferences = await getEmployeePreferences(employeeId, monthName, year);
    
    // Calculate preference satisfaction score
    const satisfactionScore = calculateSatisfactionScore(formattedEntries, preferences);
    
    res.status(200).json({
      employeeId: parseInt(employeeId),
      employeeName: `${employee.first_name} ${employee.last_name}`,
      month: monthName,
      year: year,
      totalHours: totalHours,
      weeklyHours: weeklyHours,
      entries: formattedEntries,
      preferences,
      satisfactionScore
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate a new schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function generateSchedule(req, res, next) {
  try {
    const { monthId } = req.params;
    const { overrideExisting = false } = req.body;
    const userId = req.user.id;
    
    // Parse monthId (format: 'YYYY-MM')
    const [year, month] = monthId.split('-').map(Number);
    
    // Get month name from month number
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    const monthName = monthNames[month - 1];
    
    // Check if month is valid
    if (!monthName) {
      throw new ApiError(400, 'Invalid month');
    }
    
    // Generate job ID
    const jobId = `gen-${year}-${month.toString().padStart(2, '0')}-${Date.now().toString().slice(-3)}`;
    
    // Start generating the schedule (this would typically be handled by a job queue in production)
    // For now, we'll start it in the background and return immediately
    setTimeout(async () => {
      try {
        // Update job status to running
        // In a real implementation, this would be stored in a database
        console.log(`Job ${jobId} started: Generating schedule for ${monthName} ${year}`);
        
        // Generate the schedule
        const result = await schedulingService.generateSchedule(
          monthName,
          year,
          overrideExisting,
          { createdBy: userId }
        );
        
        // Update job status to completed
        console.log(`Job ${jobId} completed: ${JSON.stringify(result)}`);
      } catch (error) {
        // Update job status to failed
        console.error(`Job ${jobId} failed: ${error.message}`);
      }
    }, 0);
    
    // Return immediate response with job ID
    res.status(202).json({
      success: true,
      message: 'Schedule generation initiated',
      jobId,
      status: 'pending'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get job status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getJobStatus(req, res, next) {
  try {
    const { jobId } = req.params;
    
    // In a real implementation, job status would be retrieved from a database or job queue
    // For now, we'll return a mock status based on the job ID
    const jobType = jobId.split('-')[0];
    const timestamp = parseInt(jobId.split('-').pop());
    const now = Date.now();
    const elapsedMs = now - timestamp;
    
    let status = 'pending';
    let progress = 0;
    let result = null;
    let error = null;
    
    if (elapsedMs < 2000) {
      status = 'running';
      progress = Math.min(Math.floor(elapsedMs / 20), 100);
    } else if (elapsedMs < 5000) {
      status = 'completed';
      progress = 100;
      result = {
        scheduleId: jobId.replace('gen-', ''),
        status: 'draft'
      };
    } else {
      // Simulate some job failures
      const random = Math.random();
      if (random < 0.1) {
        status = 'failed';
        error = 'Simulation error: Schedule generation failed';
      } else {
        status = 'completed';
        progress = 100;
        result = {
          scheduleId: jobId.replace('gen-', ''),
          status: 'draft'
        };
      }
    }
    
    res.status(200).json({
      jobId,
      type: jobType === 'gen' ? 'schedule-generation' : 'unknown',
      status,
      progress,
      startTime: new Date(timestamp).toISOString(),
      estimatedCompletionTime: new Date(timestamp + 5000).toISOString(),
      result,
      error
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update employee schedule entry
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function updateScheduleEntry(req, res, next) {
  try {
    const { monthId, employeeId, date } = req.params;
    const { startTime, endTime, isDayOff } = req.body;
    const userId = req.user.id;
    
    // Parse monthId (format: 'YYYY-MM')
    const [year, month] = monthId.split('-').map(Number);
    
    // Get month name from month number
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    const monthName = monthNames[month - 1];
    
    // Find the schedule
    const schedule = await GeneratedSchedule.findOne({
      where: {
        month_name: monthName,
        year: year
      }
    });
    
    if (!schedule) {
      throw new ApiError(404, 'Schedule not found for this month');
    }
    
    // Find the entry
    const entry = await ScheduleEntry.findOne({
      where: {
        schedule_id: schedule.id,
        employee_id: employeeId,
        schedule_date: date
      }
    });
    
    if (!entry) {
      throw new ApiError(404, 'Schedule entry not found');
    }
    
    // Check if this is a fixed shift
    if (entry.is_fixed_shift) {
      throw new ApiError(403, 'Cannot modify a fixed shift');
    }
    
    // Update the entry
    entry.start_time = isDayOff ? null : startTime;
    entry.end_time = isDayOff ? null : endTime;
    entry.is_day_off = isDayOff || false;
    
    // Calculate shift duration
    if (!isDayOff && startTime && endTime) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
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
      
      entry.shift_duration_hours = hours + (minutes / 60);
    } else {
      entry.shift_duration_hours = 0;
    }
    
    entry.last_modified_by = userId;
    await entry.save();
    
    // Update employee monthly hours
    await updateEmployeeMonthlyHours(schedule.id, employeeId);
    
    // Update employee weekly hours
    await updateEmployeeWeeklyHours(schedule.id, employeeId);
    
    // Get updated total hours
    const totalHours = await calculateEmployeeTotalHours(schedule.id, employeeId);
    
    res.status(200).json({
      success: true,
      message: 'Schedule entry updated successfully',
      entry: {
        date: entry.schedule_date.toISOString().split('T')[0],
        dayOfWeek: entry.day_of_week,
        startTime: entry.start_time,
        endTime: entry.end_time,
        isDayOff: entry.is_day_off,
        isFixed: entry.is_fixed_shift,
        hours: entry.shift_duration_hours
      },
      newTotalHours: totalHours
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Publish a schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function publishSchedule(req, res, next) {
  try {
    const { monthId } = req.params;
    
    // Parse monthId (format: 'YYYY-MM')
    const [year, month] = monthId.split('-').map(Number);
    
    // Get month name from month number
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    const monthName = monthNames[month - 1];
    
    // Find the schedule
    const schedule = await GeneratedSchedule.findOne({
      where: {
        month_name: monthName,
        year: year
      }
    });
    
    if (!schedule) {
      throw new ApiError(404, 'Schedule not found for this month');
    }
    
    // Check if the schedule is already published
    if (schedule.status === 'published') {
      return res.status(200).json({
        success: true,
        message: 'Schedule is already published',
        publishDate: schedule.published_at
      });
    }
    
    // Validate the schedule
    const validation = await validateSchedule(schedule.id);
    if (!validation.valid) {
      throw new ApiError(400, 'Schedule validation failed', validation.violations);
    }
    
    // Update the schedule
    schedule.status = 'published';
    schedule.published_at = new Date();
    await schedule.save();
    
    // TODO: Send notifications to employees
    
    res.status(200).json({
      success: true,
      message: 'Schedule published successfully',
      publishDate: schedule.published_at
    });
  } catch (error) {
    next(error);
  }
}

// Helper functions

/**
 * Get schedule statistics
 * @param {number} scheduleId - Schedule ID
 * @returns {Promise<Object>} Schedule statistics
 */
async function getScheduleStatistics(scheduleId) {
  const { EmployeeMonthlyHours, EmployeeWeeklyHours, MonthlyWorkingHours, GeneratedSchedule } = require('../models');
  
  // Get the schedule
  const schedule = await GeneratedSchedule.findByPk(scheduleId);
  
  // Get the target hours for the month
  const monthlyHours = await MonthlyWorkingHours.findOne({
    where: {
      month_name: schedule.month_name,
      year: schedule.year
    }
  });
  
  const targetHours = monthlyHours ? monthlyHours.target_hours : 0;
  
  // Get all employee monthly hours
  const monthlyHoursRecords = await EmployeeMonthlyHours.findAll({
    where: {
      schedule_id: scheduleId
    }
  });
  
  // Calculate total hours and statistics
  const totalEmployees = monthlyHoursRecords.length;
  const totalHours = monthlyHoursRecords.reduce((sum, record) => sum + record.total_hours, 0);
  const averageHoursPerEmployee = totalEmployees > 0 ? totalHours / totalEmployees : 0;
  const maxHoursPerEmployee = Math.max(...monthlyHoursRecords.map(record => record.total_hours), 0);
  const minHoursPerEmployee = Math.min(...monthlyHoursRecords.map(record => record.total_hours), 0);
  
  // Get weekly distribution
  const weeklyHoursRecords = await EmployeeWeeklyHours.findAll({
    where: {
      schedule_id: scheduleId
    },
    attributes: ['week_number', 'total_hours'],
    raw: true
  });
  
  const weeklyDistribution = [];
  if (weeklyHoursRecords.length > 0) {
    const maxWeek = Math.max(...weeklyHoursRecords.map(record => record.week_number));
    for (let i = 1; i <= maxWeek; i++) {
      const weekRecords = weeklyHoursRecords.filter(record => record.week_number === i);
      const weekTotal = weekRecords.reduce((sum, record) => sum + record.total_hours, 0);
      weeklyDistribution.push(weekTotal);
    }
  }
  
  return {
    targetHours,
    totalEmployees,
    totalHours,
    averageHoursPerEmployee,
    maxHoursPerEmployee,
    minHoursPerEmployee,
    weeklyDistribution
  };
}

/**
 * Get employee schedule summaries
 * @param {number} scheduleId - Schedule ID
 * @returns {Promise<Array>} Employee schedule summaries
 */
async function getEmployeeScheduleSummaries(scheduleId) {
  const { Employee, EmployeeMonthlyHours, EmployeeWeeklyHours } = require('../models');
  
  // Get all employee monthly hours
  const monthlyHoursRecords = await EmployeeMonthlyHours.findAll({
    where: {
      schedule_id: scheduleId
    },
    include: [{
      model: Employee,
      attributes: ['id', 'first_name', 'last_name']
    }]
  });
  
  // Get all employee weekly hours
  const weeklyHoursRecords = await EmployeeWeeklyHours.findAll({
    where: {
      schedule_id: scheduleId
    },
    attributes: ['employee_id', 'week_number', 'total_hours'],
    raw: true
  });
  
  // Format the response
  return monthlyHoursRecords.map(record => {
    const employeeWeeklyHours = weeklyHoursRecords
      .filter(whr => whr.employee_id === record.employee_id)
      .sort((a, b) => a.week_number - b.week_number)
      .map(whr => whr.total_hours);
    
    return {
      id: record.employee_id,
      name: `${record.Employee.last_name}, ${record.Employee.first_name}`,
      totalHours: record.total_hours,
      weeklyHours: employeeWeeklyHours
    };
  });
}

/**
 * Get weekly hours for an employee
 * @param {number} scheduleId - Schedule ID
 * @param {number} employeeId - Employee ID
 * @returns {Promise<Array>} Weekly hours
 */
async function getWeeklyHours(scheduleId, employeeId) {
  const { EmployeeWeeklyHours } = require('../models');
  
  const weeklyHoursRecords = await EmployeeWeeklyHours.findAll({
    where: {
      schedule_id: scheduleId,
      employee_id: employeeId
    },
    order: [['week_number', 'ASC']],
    attributes: ['total_hours'],
    raw: true
  });
  
  return weeklyHoursRecords.map(record => record.total_hours);
}

/**
 * Get employee preferences
 * @param {number} employeeId - Employee ID
 * @param {string} monthName - Month name
 * @param {number} year - Year
 * @returns {Promise<Object>} Employee preferences
 */
async function getEmployeePreferences(employeeId, monthName, year) {
  const { SchedulingPreference, WeekdayPreference, ExactDatePreference } = require('../models');
  
  const preference = await SchedulingPreference.findOne({
    where: {
      employee_id: employeeId,
      target_month: monthName,
      target_year: year
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
    ]
  });
  
  if (!preference) {
    return {
      weekdayPreferences: {},
      exactDatePreferences: []
    };
  }
  
  // Format weekday preferences
  const weekdayPreferences = {};
  preference.weekdayPreferences.forEach(wp => {
    weekdayPreferences[wp.day_of_week] = wp.shift_preference;
  });
  
  // Format exact date preferences
  const exactDatePreferences = preference.exactDatePreferences.map(ep => ({
    date: ep.exact_date.toISOString().split('T')[0],
    startTime: ep.start_time,
    endTime: ep.end_time
  }));
  
  return {
    weekdayPreferences,
    exactDatePreferences
  };
}

/**
 * Calculate preference satisfaction score
 * @param {Array} entries - Schedule entries
 * @param {Object} preferences - Employee preferences
 * @returns {number} Satisfaction score
 */
function calculateSatisfactionScore(entries, preferences) {
  if (!preferences || !entries || entries.length === 0) {
    return 0;
  }
  
  let matchingEntries = 0;
  let totalEntries = 0;
  
  // Check fixed preferences (exact dates)
  if (preferences.exactDatePreferences && preferences.exactDatePreferences.length > 0) {
    for (const exactPref of preferences.exactDatePreferences) {
      const entry = entries.find(e => e.date === exactPref.date);
      if (entry && !entry.isDayOff && entry.startTime === exactPref.startTime && entry.endTime === exactPref.endTime) {
        matchingEntries++;
      }
      totalEntries++;
    }
  }
  
  // Check weekday preferences
  if (preferences.weekdayPreferences) {
    const dayMapping = {
      'Poniedziałek': 'Monday',
      'Wtorek': 'Tuesday',
      'Środa': 'Wednesday',
      'Czwartek': 'Thursday',
      'Piątek': 'Friday',
      'Sobota': 'Saturday',
      'Niedziela': 'Sunday'
    };
    
    const shiftMapping = {
      'Pierwsza zmiana': '07:00-15:00',
      'Druga zmiana': '15:00-23:00',
      'Nocka': '22:00-06:00'
    };
    
    for (const entry of entries) {
      if (entry.isDayOff) {
        continue;
      }
      
      const dayOfWeek = entry.dayOfWeek;
      const preferredShift = preferences.weekdayPreferences[dayOfWeek];
      
      if (preferredShift) {
        const [prefStart, prefEnd] = shiftMapping[preferredShift]?.split('-') ?? [];
        if (entry.startTime === prefStart && entry.endTime === prefEnd) {
          matchingEntries++;
        }
        totalEntries++;
      }
    }
  }
  
  return totalEntries > 0 ? matchingEntries / totalEntries : 0;
}

/**
 * Update employee monthly hours
 * @param {number} scheduleId - Schedule ID
 * @param {number} employeeId - Employee ID
 */
async function updateEmployeeMonthlyHours(scheduleId, employeeId) {
  const { EmployeeMonthlyHours, ScheduleEntry } = require('../models');
  
  // Calculate total hours
  const totalHours = await calculateEmployeeTotalHours(scheduleId, employeeId);
  
  // Update or create monthly hours record
  const [record, created] = await EmployeeMonthlyHours.findOrCreate({
    where: {
      schedule_id: scheduleId,
      employee_id: employeeId
    },
    defaults: {
      total_hours: totalHours
    }
  });
  
  if (!created) {
    record.total_hours = totalHours;
    await record.save();
  }
}

/**
 * Update employee weekly hours
 * @param {number} scheduleId - Schedule ID
 * @param {number} employeeId - Employee ID
 */
async function updateEmployeeWeeklyHours(scheduleId, employeeId) {
  const { EmployeeWeeklyHours, ScheduleEntry } = require('../models');
  
  // Get all entries for this employee
  const entries = await ScheduleEntry.findAll({
    where: {
      schedule_id: scheduleId,
      employee_id: employeeId
    },
    order: [['schedule_date', 'ASC']]
  });
  
  // Group entries by week
  const weeks = {};
  for (const entry of entries) {
    const date = entry.schedule_date;
    const weekNumber = Math.floor((date.getDate() - 1) / 7) + 1;
    
    if (!weeks[weekNumber]) {
      weeks[weekNumber] = {
        entries: [],
        startDate: date,
        endDate: date,
        totalHours: 0
      };
    }
    
    weeks[weekNumber].entries.push(entry);
    weeks[weekNumber].totalHours += entry.shift_duration_hours || 0;
    
    if (date < weeks[weekNumber].startDate) {
      weeks[weekNumber].startDate = date;
    }
    
    if (date > weeks[weekNumber].endDate) {
      weeks[weekNumber].endDate = date;
    }
  }
  
  // Update or create weekly hours records
  for (const [weekNumber, week] of Object.entries(weeks)) {
    const [record, created] = await EmployeeWeeklyHours.findOrCreate({
      where: {
        schedule_id: scheduleId,
        employee_id: employeeId,
        week_number: weekNumber
      },
      defaults: {
        start_date: week.startDate,
        end_date: week.endDate,
        total_hours: week.totalHours
      }
    });
    
    if (!created) {
      record.start_date = week.startDate;
      record.end_date = week.endDate;
      record.total_hours = week.totalHours;
      await record.save();
    }
  }
}

/**
 * Calculate employee total hours
 * @param {number} scheduleId - Schedule ID
 * @param {number} employeeId - Employee ID
 * @returns {Promise<number>} Total hours
 */
async function calculateEmployeeTotalHours(scheduleId, employeeId) {
  const { ScheduleEntry } = require('../models');
  
  const entries = await ScheduleEntry.findAll({
    where: {
      schedule_id: scheduleId,
      employee_id: employeeId
    },
    attributes: ['shift_duration_hours'],
    raw: true
  });
  
  return entries.reduce((sum, entry) => sum + (entry.shift_duration_hours || 0), 0);
}

/**
 * Validate schedule
 * @param {number} scheduleId - Schedule ID
 * @returns {Promise<Object>} Validation result
 */
async function validateSchedule(scheduleId) {
  const { EmployeeMonthlyHours, EmployeeWeeklyHours, MonthlyWorkingHours, GeneratedSchedule } = require('../models');
  
  const violations = [];
  
  // Get the schedule
  const schedule = await GeneratedSchedule.findByPk(scheduleId);
  
  // Get the target hours for the month
  const monthlyHours = await MonthlyWorkingHours.findOne({
    where: {
      month_name: schedule.month_name,
      year: schedule.year
    }
  });
  
  const targetHours = monthlyHours ? monthlyHours.target_hours : 0;
  
  // Get all employee monthly hours
  const monthlyHoursRecords = await EmployeeMonthlyHours.findAll({
    where: {
      schedule_id: scheduleId
    },
    include: [{
      model: Employee,
      attributes: ['id', 'first_name', 'last_name']
    }]
  });
  
  // Check monthly hours for each employee
  for (const record of monthlyHoursRecords) {
    const employeeName = `${record.Employee.first_name} ${record.Employee.last_name}`;
    
    if (Math.abs(record.total_hours - targetHours) > 0.5) {
      violations.push({
        type: 'monthly_hours',
        employee: employeeName,
        message: `Monthly hours for ${employeeName} (${record.total_hours}) do not match target (${targetHours})`
      });
    }
  }
  
  // Get all employee weekly hours
  const weeklyHoursRecords = await EmployeeWeeklyHours.findAll({
    where: {
      schedule_id: scheduleId
    },
    include: [{
      model: Employee,
      attributes: ['id', 'first_name', 'last_name']
    }]
  });
  
  // Check weekly hours for each employee
  for (const record of weeklyHoursRecords) {
    const employeeName = `${record.Employee.first_name} ${record.Employee.last_name}`;
    
    if (record.total_hours > 60) {
      violations.push({
        type: 'weekly_hours',
        employee: employeeName,
        message: `Weekly hours for ${employeeName} (${record.total_hours}) exceed limit (60) in week ${record.week_number}`
      });
    }
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}

module.exports = {
  getSchedule,
  getAllSchedules,
  getScheduleDetails,
  getEmployeeScheduleDetails,
  generateSchedule,
  getJobStatus,
  updateScheduleEntry,
  publishSchedule
};