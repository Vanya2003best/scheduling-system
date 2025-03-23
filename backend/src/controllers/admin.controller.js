const {
  Employee,
  User,
  StaffingRequirement,
  MonthlyWorkingHours,
  GeneratedSchedule,
  ScheduleEntry,
  sequelize
} = require('../models');
const scheduleGenerator = require('../services/scheduleGenerator.service');

/**
 * Get all employees
 */
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [{ model: User, attributes: ['email', 'role', 'is_active'] }],
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });
    
    // Format response
    const formattedEmployees = employees.map(employee => ({
      id: employee.id,
      userId: employee.user_id,
      firstName: employee.first_name,
      lastName: employee.last_name,
      position: employee.position,
      department: employee.department,
      hireDate: employee.hire_date,
      email: employee.User.email,
      role: employee.User.role,
      isActive: employee.User.is_active
    }));
    
    res.status(200).json(formattedEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

/**
 * Get all schedules (including draft ones)
 */
exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await GeneratedSchedule.findAll({
      order: [['year', 'DESC'], ['month_number', 'DESC']]
    });
    
    // Format response
    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      monthName: schedule.month_name,
      monthNumber: schedule.month_number,
      year: schedule.year,
      status: schedule.status,
      generationTimestamp: schedule.generation_timestamp
    }));
    
    res.status(200).json(formattedSchedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

/**
 * Generate a new schedule
 */
exports.generateSchedule = async (req, res) => {
  try {
    const monthId = req.params.monthId;
    const options = req.body.options || {};
    
    // Find monthly settings
    const monthSettings = await MonthlyWorkingHours.findByPk(monthId);
    if (!monthSettings) {
      return res.status(404).json({ error: 'Month not found' });
    }
    
    // Start the schedule generation job
    const jobId = await scheduleGenerator.startGenerationJob(
      monthSettings.month_name,
      monthSettings.month_number,
      monthSettings.year,
      monthSettings.target_hours,
      req.user.id,
      options
    );
    
    // Return the job ID so the client can check status
    res.status(202).json({
      id: jobId,
      status: 'pending',
      progress: 0,
      message: 'Schedule generation started'
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
};

/**
 * Check job status
 */
exports.checkJobStatus = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const status = await scheduleGenerator.getJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.status(200).json(status);
  } catch (error) {
    console.error('Error checking job status:', error);
    res.status(500).json({ error: 'Failed to check job status' });
  }
};

/**
 * Publish a schedule
 */
exports.publishSchedule = async (req, res) => {
  try {
    const monthId = req.params.monthId;
    
    // Find the schedule
    const schedule = await GeneratedSchedule.findByPk(monthId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Check if it's already published
    if (schedule.status === 'published') {
      return res.status(400).json({ error: 'Schedule is already published' });
    }
    
    // Update status
    await schedule.update({
      status: 'published'
    });
    
    // TODO: Send notifications to employees
    
    res.status(200).json({
      id: schedule.id,
      status: 'published',
      message: 'Schedule published successfully'
    });
  } catch (error) {
    console.error('Error publishing schedule:', error);
    res.status(500).json({ error: 'Failed to publish schedule' });
  }
};

/**
 * Get staffing requirements
 */
exports.getStaffingRequirements = async (req, res) => {
  try {
    const requirements = await StaffingRequirement.findAll({
      order: [
        ['day_of_week', 'ASC'],
        ['hour_of_day', 'ASC']
      ]
    });
    
    // Format response
    const formattedRequirements = requirements.map(req => ({
      id: req.id,
      dayOfWeek: req.day_of_week,
      hourOfDay: req.hour_of_day,
      requiredEmployees: req.required_employees
    }));
    
    res.status(200).json(formattedRequirements);
  } catch (error) {
    console.error('Error fetching staffing requirements:', error);
    res.status(500).json({ error: 'Failed to fetch staffing requirements' });
  }
};

/**
 * Update staffing requirements
 */
exports.updateStaffingRequirements = async (req, res) => {
  try {
    const requirements = req.body.requirements;
    
    if (!Array.isArray(requirements)) {
      return res.status(400).json({ error: 'Invalid requirements format' });
    }
    
    // Update in transaction
    await sequelize.transaction(async (t) => {
      // For simplicity, delete all existing requirements first
      await StaffingRequirement.destroy({
        where: {},
        truncate: true,
        transaction: t
      });
      
      // Create new requirements
      await Promise.all(requirements.map(req => 
        StaffingRequirement.create({
          day_of_week: req.dayOfWeek,
          hour_of_day: req.hourOfDay,
          required_employees: req.requiredEmployees
        }, { transaction: t })
      ));
    });
    
    // Fetch and return updated requirements
    const updatedRequirements = await StaffingRequirement.findAll({
      order: [
        ['day_of_week', 'ASC'],
        ['hour_of_day', 'ASC']
      ]
    });
    
    // Format response
    const formattedRequirements = updatedRequirements.map(req => ({
      id: req.id,
      dayOfWeek: req.day_of_week,
      hourOfDay: req.hour_of_day,
      requiredEmployees: req.required_employees
    }));
    
    res.status(200).json(formattedRequirements);
  } catch (error) {
    console.error('Error updating staffing requirements:', error);
    res.status(500).json({ error: 'Failed to update staffing requirements' });
  }
};

/**
 * Get monthly hours
 */
exports.getMonthlyHours = async (req, res) => {
  try {
    const monthlyHours = await MonthlyWorkingHours.findAll({
      order: [['year', 'DESC'], ['month_number', 'ASC']]
    });
    
    // Format response
    const formattedMonthlyHours = monthlyHours.map(month => ({
      id: month.id,
      monthName: month.month_name,
      monthNumber: month.month_number,
      year: month.year,
      targetHours: month.target_hours
    }));
    
    res.status(200).json(formattedMonthlyHours);
  } catch (error) {
    console.error('Error fetching monthly hours:', error);
    res.status(500).json({ error: 'Failed to fetch monthly hours' });
  }
};

/**
 * Update monthly hours
 */
exports.updateMonthlyHours = async (req, res) => {
  try {
    const { year, monthNumber } = req.params;
    const { targetHours } = req.body;
    
    if (!targetHours || targetHours <= 0) {
      return res.status(400).json({ error: 'Invalid target hours' });
    }
    
    // Find the month
    let month = await MonthlyWorkingHours.findOne({
      where: {
        year,
        month_number: monthNumber
      }
    });
    
    if (month) {
      // Update existing month
      await month.update({
        target_hours: targetHours
      });
    } else {
      // Create new month
      const monthName = getMonthName(parseInt(monthNumber)); // Helper function
      month = await MonthlyWorkingHours.create({
        month_name: monthName,
        month_number: monthNumber,
        year,
        target_hours: targetHours
      });
    }
    
    // Format response
    const formattedMonth = {
      id: month.id,
      monthName: month.month_name,
      monthNumber: month.month_number,
      year: month.year,
      targetHours: month.target_hours
    };
    
    res.status(200).json(formattedMonth);
  } catch (error) {
    console.error('Error updating monthly hours:', error);
    res.status(500).json({ error: 'Failed to update monthly hours' });
  }
};

// Helper function to get month name
function getMonthName(monthNumber) {
  const months = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];
  return months[monthNumber - 1]; // Month number is 1-based
}