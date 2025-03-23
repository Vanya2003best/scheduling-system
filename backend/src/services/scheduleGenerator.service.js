const { v4: uuidv4 } = require('uuid');
const { 
  GeneratedSchedule, 
  SchedulingPreference,
  WeekdayPreference,
  ExactDatePreference,
  Employee, 
  ScheduleEntry, 
  StaffingRequirement,
  EmployeeMonthlyHours,
  EmployeeWeeklyHours,
  sequelize
} = require('../models');

// In-memory store for job status (in a real system, this would be stored in a database or Redis)
const jobStore = new Map();

/**
 * Start a new schedule generation job
 */
exports.startGenerationJob = async (
  monthName, 
  monthNumber, 
  year, 
  targetHours, 
  userId, 
  options = {}
) => {
  // Generate a unique job ID
  const jobId = uuidv4();
  
  // Initialize job status
  const job = {
    id: jobId,
    status: 'pending',
    progress: 0,
    startTime: new Date(),
    endTime: null,
    result: null,
    error: null
  };
  
  // Store job status
  jobStore.set(jobId, job);
  
  // Start the generation process asynchronously
  setTimeout(() => {
    generateSchedule(
      jobId, 
      monthName, 
      monthNumber, 
      year, 
      targetHours, 
      userId, 
      options
    ).catch(error => {
      console.error('Schedule generation error:', error);
      
      // Update job status on error
      const job = jobStore.get(jobId);
      if (job) {
        job.status = 'failed';
        job.endTime = new Date();
        job.error = error.message;
        jobStore.set(jobId, job);
      }
    });
  }, 0);
  
  return jobId;
};

/**
 * Get job status
 */
exports.getJobStatus = async (jobId) => {
  return jobStore.get(jobId) || null;
};

/**
 * Implementation of the schedule generation algorithm
 */
async function generateSchedule(
  jobId, 
  monthName, 
  monthNumber, 
  year, 
  targetHours, 
  userId, 
  options = {}
) {
  try {
    // Update job to running
    const job = jobStore.get(jobId);
    job.status = 'running';
    jobStore.set(jobId, job);
    
    // Step 1: Prepare the schedule
    updateJobProgress(jobId, 10, 'Preparing schedule');
    
    // Create or update schedule record
    let schedule = await GeneratedSchedule.findOne({
      where: {
        month_name: monthName,
        month_number: monthNumber,
        year
      }
    });
    
    if (schedule) {
      await schedule.update({
        status: 'draft',
        generation_timestamp: new Date(),
        created_by: userId
      });
    } else {
      schedule = await GeneratedSchedule.create({
        month_name: monthName,
        month_number: monthNumber,
        year,
        status: 'draft',
        generation_timestamp: new Date(),
        created_by: userId
      });
    }
    
    // Step 2: Get all employees
    updateJobProgress(jobId, 20, 'Fetching employees');
    const employees = await Employee.findAll();
    
    // Step 3: Get their preferences
    updateJobProgress(jobId, 30, 'Fetching employee preferences');
    const preferences = await SchedulingPreference.findAll({
      where: {
        target_month: monthName,
        target_year: year
      },
      include: [
        { model: WeekdayPreference },
        { model: ExactDatePreference }
      ]
    });
    
    // Step 4: Get staffing requirements
    updateJobProgress(jobId, 40, 'Fetching staffing requirements');
    const staffingRequirements = await StaffingRequirement.findAll();
    
    // Step 5: Generate schedule entries (in a real system, this would be more complex)
    updateJobProgress(jobId, 50, 'Generating schedule entries');
    
    // In a transaction to ensure data consistency
    await sequelize.transaction(async (t) => {
      // Step A: Clear existing entries (if regenerating)
      await ScheduleEntry.destroy({
        where: { schedule_id: schedule.id },
        transaction: t
      });
      
      // Step B: Clear existing hour calculations
      await EmployeeMonthlyHours.destroy({
        where: { schedule_id: schedule.id },
        transaction: t
      });
      
      await EmployeeWeeklyHours.destroy({
        where: { schedule_id: schedule.id },
        transaction: t
      });
      
      // Step C: For each employee, generate entries
      // For this simplified example, we'll generate entries based directly on preferences
      // In a real system, this would involve complex constraint satisfaction
      let employeeCount = 0;
      
      for (const employee of employees) {
        // Update progress for each employee
        updateJobProgress(
          jobId, 
          50 + Math.floor((employeeCount / employees.length) * 40), 
          `Generating schedule for employee ${employeeCount + 1} of ${employees.length}`
        );
        
        // Find employee's preferences
        const preference = preferences.find(p => p.employee_id === employee.id);
        
        // Generate days in month
        const daysInMonth = getDaysInMonth(monthNumber, year);
        
        // Track hours
        let totalHours = 0;
        const weeklyHours = new Array(6).fill(0); // Up to 6 weeks in a month
        
        // For each day in the month
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, monthNumber - 1, day);
          const dayOfWeek = getDayOfWeekName(date);
          
          let entry;
          
          // Check if there's a fixed preference for this date
          const exactDatePreference = preference?.ExactDatePreferences.find(
            edp => {
              const edate = new Date(edp.exact_date);
              return edate.getDate() === day && 
                     edate.getMonth() === monthNumber - 1 && 
                     edate.getFullYear() === year;
            }
          );
          
          if (exactDatePreference) {
            // Use exact date preference (fixed)
            const duration = calculateHours(
              exactDatePreference.start_time, 
              exactDatePreference.end_time
            );
            
            entry = {
              schedule_id: schedule.id,
              employee_id: employee.id,
              schedule_date: date,
              day_of_week: dayOfWeek,
              start_time: exactDatePreference.start_time,
              end_time: exactDatePreference.end_time,
              is_day_off: false,
              is_fixed_shift: true,
              shift_duration_hours: duration
            };
            
            totalHours += duration;
            
            // Add to weekly total
            const weekNumber = Math.floor((day - 1) / 7);
            weeklyHours[weekNumber] += duration;
          } else {
            // Check for weekday preference
            const weekdayPreference = preference?.WeekdayPreferences.find(
              wp => wp.day_of_week === dayOfWeek
            );
            
            if (weekdayPreference && weekdayPreference.shift_preference) {
              // Get shift times from the shift definition (this would be a lookup in a real system)
              const shiftTimes = getShiftTimes(weekdayPreference.shift_preference);
              
              if (shiftTimes) {
                const duration = calculateHours(shiftTimes.startTime, shiftTimes.endTime);
                
                entry = {
                  schedule_id: schedule.id,
                  employee_id: employee.id,
                  schedule_date: date,
                  day_of_week: dayOfWeek,
                  start_time: shiftTimes.startTime,
                  end_time: shiftTimes.endTime,
                  is_day_off: false,
                  is_fixed_shift: false,
                  shift_duration_hours: duration
                };
                
                totalHours += duration;
                
                // Add to weekly total
                const weekNumber = Math.floor((day - 1) / 7);
                weeklyHours[weekNumber] += duration;
              } else {
                // Default to day off if shift not found
                entry = {
                  schedule_id: schedule.id,
                  employee_id: employee.id,
                  schedule_date: date,
                  day_of_week: dayOfWeek,
                  start_time: null,
                  end_time: null,
                  is_day_off: true,
                  is_fixed_shift: false,
                  shift_duration_hours: 0
                };
              }
            } else {
              // No preference, default to day off
              entry = {
                schedule_id: schedule.id,
                employee_id: employee.id,
                schedule_date: date,
                day_of_week: dayOfWeek,
                start_time: null,
                end_time: null,
                is_day_off: true,
                is_fixed_shift: false,
                shift_duration_hours: 0
              };
            }
          }
          
          // Create the entry
          await ScheduleEntry.create(entry, { transaction: t });
        }
        
        // Create monthly hours record
        await EmployeeMonthlyHours.create({
          schedule_id: schedule.id,
          employee_id: employee.id,
          total_hours: totalHours
        }, { transaction: t });
        
        // Create weekly hours records
        for (let weekNumber = 0; weekNumber < weeklyHours.length; weekNumber++) {
          if (weeklyHours[weekNumber] > 0) {
            const startDate = new Date(year, monthNumber - 1, weekNumber * 7 + 1);
            const endDate = new Date(year, monthNumber - 1, Math.min(weekNumber * 7 + 7, daysInMonth));
            
            await EmployeeWeeklyHours.create({
              schedule_id: schedule.id,
              employee_id: employee.id,
              week_number: weekNumber + 1,
              start_date: startDate,
              end_date: endDate,
              total_hours: weeklyHours[weekNumber]
            }, { transaction: t });
          }
        }
        
        employeeCount++;
      }
    });
    
    // Step 6: Optimize the schedule (in a real system)
    updateJobProgress(jobId, 90, 'Optimizing schedule');
    
    // This is a placeholder for the complex optimization logic
    // In a real system, this would involve multiple passes of constraint satisfaction
    
    // Step 7: Finalize
    updateJobProgress(jobId, 100, 'Finalizing schedule');
    
    // Update job status
    job.status = 'completed';
    job.progress = 100;
    job.endTime = new Date();
    job.result = {
      scheduleId: schedule.id
    };
    jobStore.set(jobId, job);
    
    return {
      scheduleId: schedule.id
    };
  } catch (error) {
    // Update job status on error
    const job = jobStore.get(jobId);
    job.status = 'failed';
    job.endTime = new Date();
    job.error = error.message;
    jobStore.set(jobId, job);
    
    // Re-throw for caller
    throw error;
  }
}

/**
 * Update job progress
 */
function updateJobProgress(jobId, progress, message) {
  const job = jobStore.get(jobId);
  if (job) {
    job.progress = progress;
    job.message = message;
    jobStore.set(jobId, job);
  }
}

/**
 * Helper function to calculate days in month
 */
function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

/**
 * Helper function to get day of week name
 */
function getDayOfWeekName(date) {
  const days = [
    'Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 
    'Czwartek', 'Piątek', 'Sobota'
  ];
  return days[date.getDay()];
}

/**
 * Helper function to calculate hours between two times
 */
function calculateHours(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let hours = endHour - startHour;
  let minutes = endMinute - startMinute;
  
  if (hours < 0) {
    // Shift spans midnight
    hours += 24;
  }
  
  return hours + minutes / 60;
}

/**
 * Helper function to get shift times from shift name
 */
function getShiftTimes(shiftName) {
  const shifts = {
    'Pierwsza zmiana': { startTime: '07:00', endTime: '15:00' },
    'Druga zmiana': { startTime: '15:00', endTime: '23:00' },
    'Nocka': { startTime: '22:00', endTime: '06:00' }
  };
  
  return shifts[shiftName] || null;
}