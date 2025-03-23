const {
  GeneratedSchedule,
  ScheduleEntry,
  Employee,
  MonthlyWorkingHours,
  EmployeeMonthlyHours,
  EmployeeWeeklyHours
} = require('../models');

/**
 * Get all available schedules for the current user
 */
exports.getAllSchedules = async (req, res) => {
  try {
    // Get user's employee ID
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    // Get published schedules
    const schedules = await GeneratedSchedule.findAll({
      where: {
        status: 'published' // Only show published schedules to employees
      },
      order: [['year', 'DESC'], ['month_number', 'DESC']]
    });
    
    // Format response
    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      monthName: schedule.month_name,
      monthNumber: schedule.month_number,
      year: schedule.year,
      status: schedule.status
    }));
    
    res.status(200).json(formattedSchedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

/**
 * Get a specific schedule for the current user
 */
exports.getSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.monthId;
    
    // Get user's employee ID
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    // Get schedule
    const schedule = await GeneratedSchedule.findByPk(scheduleId);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // For employees, only published schedules are visible
    if (req.user.role !== 'admin' && schedule.status !== 'published') {
      return res.status(403).json({ error: 'This schedule is not yet published' });
    }
    
    // Get schedule entries for this employee
    const entries = await ScheduleEntry.findAll({
      where: {
        schedule_id: schedule.id,
        employee_id: employee.id
      },
      order: [['schedule_date', 'ASC']]
    });
    
    // Get monthly hours summary
    const monthlyHours = await EmployeeMonthlyHours.findOne({
      where: {
        schedule_id: schedule.id,
        employee_id: employee.id
      }
    });
    
    // Get weekly hours breakdown
    const weeklyHours = await EmployeeWeeklyHours.findAll({
      where: {
        schedule_id: schedule.id,
        employee_id: employee.id
      },
      order: [['week_number', 'ASC']]
    });
    
    // Count different types of shifts
    const fixedShifts = entries.filter(entry => entry.is_fixed_shift && !entry.is_day_off).length;
    const flexibleShifts = entries.filter(entry => !entry.is_fixed_shift && !entry.is_day_off).length;
    const daysOff = entries.filter(entry => entry.is_day_off).length;
    
    // Format the schedule entries
    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      scheduleDate: entry.schedule_date.toISOString().split('T')[0],
      dayOfWeek: entry.day_of_week,
      startTime: entry.start_time,
      endTime: entry.end_time,
      isDayOff: entry.is_day_off,
      isFixedShift: entry.is_fixed_shift,
      shiftDurationHours: entry.shift_duration_hours
    }));
    
    // Format the summary
    const summary = {
      totalHours: monthlyHours ? monthlyHours.total_hours : 0,
      weeklyHours: weeklyHours.map(wh => ({
        weekNumber: wh.week_number,
        hours: wh.total_hours
      })),
      fixedShifts,
      flexibleShifts,
      daysOff
    };
    
    // Format the complete response
    const response = {
      id: schedule.id,
      monthName: schedule.month_name,
      monthNumber: schedule.month_number,
      year: schedule.year,
      status: schedule.status,
      entries: formattedEntries,
      summary
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
};