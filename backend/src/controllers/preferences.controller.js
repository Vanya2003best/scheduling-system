const { Op } = require('sequelize');
const { 
  SchedulingPreference, 
  WeekdayPreference, 
  ExactDatePreference, 
  MonthlyWorkingHours,
  Employee, 
  sequelize 
} = require('../models');

/**
 * Get available months for preference submission
 */
exports.getAvailableMonths = async (req, res) => {
  try {
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    const currentDate = new Date();
    const availableMonths = await MonthlyWorkingHours.findAll({
      where: {
        year: currentDate.getFullYear(),
        month_number: {
          [Op.gte]: currentDate.getMonth() + 1
        }
      },
      order: [['year', 'ASC'], ['month_number', 'ASC']],
      limit: 4
    });
    
    const monthsData = availableMonths.map(month => ({
      id: month.id,
      monthName: month.month_name,
      monthNumber: month.month_number,
      year: month.year,
      targetHours: month.target_hours
    }));
    
    res.status(200).json(monthsData);
  } catch (error) {
    console.error('Error fetching available months:', error);
    res.status(500).json({ error: 'Failed to fetch available months' });
  }
};

/**
 * Get preferences for a specific month
 */
exports.getPreference = async (req, res) => {
  try {
    const monthId = req.params.monthId;
    
    // Get user's employee ID
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    // Find monthly settings
    const monthSettings = await MonthlyWorkingHours.findByPk(monthId);
    
    if (!monthSettings) {
      // If specific month not found, try to get the latest month
      const latestMonth = await MonthlyWorkingHours.findOne({
        order: [['year', 'DESC'], ['month_number', 'DESC']]
      });
      
      if (!latestMonth) {
        return res.status(404).json({ error: 'No month settings found' });
      }
      
      console.log(`Specific month not found, using latest month: ${latestMonth.month_name} ${latestMonth.year}`);
      
      // Return a response with the latest month
      return res.status(200).json({
        monthId: latestMonth.id,
        targetMonth: latestMonth.month_name,
        targetYear: latestMonth.year,
        weekdayPreferences: [],
        exactDatePreferences: []
      });
    }
    
    console.log(`Found month settings: ${monthSettings.month_name} ${monthSettings.year}`);
    
    // Find existing preference
    const preference = await SchedulingPreference.findOne({
      where: {
        employee_id: employee.id,
        target_month: monthSettings.month_name,
        target_year: monthSettings.year
      },
      include: [
        { model: WeekdayPreference, as: 'weekdayPreferences' },
        { model: ExactDatePreference, as: 'exactDatePreferences' }
      ]
    });
    
    if (!preference) {
      // Return empty preference template
      return res.status(200).json({
        monthId: monthSettings.id,
        targetMonth: monthSettings.month_name,
        targetYear: monthSettings.year,
        weekdayPreferences: [],
        exactDatePreferences: []
      });
    }
    
    // Format the response
    const formattedPreference = {
      id: preference.id,
      monthId: monthSettings.id,
      employeeId: preference.employee_id,
      targetMonth: preference.target_month,
      targetYear: preference.target_year,
      weekdayPreferences: preference.weekdayPreferences.map(wp => ({
        dayOfWeek: wp.day_of_week,
        shiftPreference: wp.shift_preference
      })),
      exactDatePreferences: preference.exactDatePreferences.map(edp => ({
        exactDate: edp.exact_date.toISOString().split('T')[0],
        startTime: edp.start_time,
        endTime: edp.end_time
      }))
    };
    
    res.status(200).json(formattedPreference);
  } catch (error) {
    console.error('Error fetching preference:', error);
    res.status(500).json({ error: 'Failed to fetch preference' });
  }
};

/**
 * Submit preferences for a specific month
 */
exports.submitPreference = async (req, res) => {
  try {
    const monthId = req.params.monthId;
    const { weekdayPreferences, exactDatePreferences } = req.body;
    
    // Get user's employee ID
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    // Find monthly settings
    const monthSettings = await MonthlyWorkingHours.findByPk(monthId);
    
    if (!monthSettings) {
      // If specific month not found, try to get the latest month
      const latestMonth = await MonthlyWorkingHours.findOne({
        order: [['year', 'DESC'], ['month_number', 'DESC']]
      });
      
      if (!latestMonth) {
        return res.status(404).json({ error: 'No month settings found' });
      }
      
      console.log(`Specific month not found for submission, using latest month: ${latestMonth.month_name} ${latestMonth.year}`);
      
      // Create or update preference in a transaction using the latest month
      return await submitPreferenceWithMonth(req, res, employee, latestMonth, weekdayPreferences, exactDatePreferences);
    }
    
    console.log(`Found month settings for submission: ${monthSettings.month_name} ${monthSettings.year}`);
    
    // Create or update preference in a transaction
    return await submitPreferenceWithMonth(req, res, employee, monthSettings, weekdayPreferences, exactDatePreferences);
  } catch (error) {
    console.error('Error submitting preference:', error);
    res.status(500).json({ error: 'Failed to submit preference' });
  }
};

/**
 * Helper function for submitting preferences with given month
 */
async function submitPreferenceWithMonth(req, res, employee, monthSettings, weekdayPreferences, exactDatePreferences) {
  try {
    // Create or update preference in a transaction
    const result = await sequelize.transaction(async (t) => {
      // Check if preference already exists
      let preference = await SchedulingPreference.findOne({
        where: {
          employee_id: employee.id,
          target_month: monthSettings.month_name,
          target_year: monthSettings.year
        },
        transaction: t
      });
      
      if (preference) {
        // If preference exists, update submission timestamp
        await preference.update({
          submission_timestamp: new Date()
        }, { transaction: t });
      } else {
        // Create new preference with explicit values
        preference = await SchedulingPreference.create({
          employee_id: employee.id,
          target_month: monthSettings.month_name,
          target_year: monthSettings.year,
          submission_timestamp: new Date()
        }, { transaction: t });
      }
      
      // For an existing preference, delete old entries first
      if (preference.id) {
        await WeekdayPreference.destroy({
          where: { preference_id: preference.id },
          transaction: t
        });
        
        await ExactDatePreference.destroy({
          where: { preference_id: preference.id },
          transaction: t
        });
      }
      
      // Create new weekday preferences
      if (weekdayPreferences && weekdayPreferences.length > 0) {
        await Promise.all(weekdayPreferences.map(wp => 
          WeekdayPreference.create({
            preference_id: preference.id,
            day_of_week: wp.dayOfWeek,
            shift_preference: wp.shiftPreference
          }, { transaction: t })
        ));
      }
      
      // Create new exact date preferences
      if (exactDatePreferences && exactDatePreferences.length > 0) {
        await Promise.all(exactDatePreferences.map(edp => 
          ExactDatePreference.create({
            preference_id: preference.id,
            exact_date: edp.exactDate,
            start_time: edp.startTime,
            end_time: edp.endTime
          }, { transaction: t })
        ));
      }
      
      return preference;
    });
    
    // Fetch complete preference with associations
    const completePreference = await SchedulingPreference.findByPk(result.id, {
      include: [
        { model: WeekdayPreference, as: 'weekdayPreferences' },
        { model: ExactDatePreference, as: 'exactDatePreferences' }
      ]
    });
    
    // Format the response
    const formattedPreference = {
      id: completePreference.id,
      monthId: monthSettings.id,
      employeeId: completePreference.employee_id,
      targetMonth: completePreference.target_month,
      targetYear: completePreference.target_year,
      weekdayPreferences: completePreference.weekdayPreferences.map(wp => ({
        dayOfWeek: wp.day_of_week,
        shiftPreference: wp.shift_preference
      })),
      exactDatePreferences: completePreference.exactDatePreferences.map(edp => ({
        exactDate: edp.exact_date.toISOString().split('T')[0],
        startTime: edp.start_time,
        endTime: edp.end_time
      }))
    };
    
    res.status(200).json(formattedPreference);
  } catch (error) {
    console.error('Error in submitPreferenceWithMonth:', error);
    res.status(500).json({ error: 'Failed to submit preference' });
  }
}

/**
 * Get latest available month
 */
exports.getLatestMonth = async (req, res) => {
  try {
    // Find latest month
    const latestMonth = await MonthlyWorkingHours.findOne({
      order: [['year', 'DESC'], ['month_number', 'DESC']]
    });
    
    if (!latestMonth) {
      return res.status(404).json({ error: 'No month settings found' });
    }
    
    console.log(`Found latest month: ${latestMonth.month_name} ${latestMonth.year}`);
    
    res.status(200).json({
      id: latestMonth.id,
      monthName: latestMonth.month_name,
      monthNumber: latestMonth.month_number,
      year: latestMonth.year,
      targetHours: latestMonth.target_hours
    });
  } catch (error) {
    console.error('Error fetching latest month:', error);
    res.status(500).json({ error: 'Failed to fetch latest month' });
  }
};

/**
 * Get preferences for current user and latest month
 */
exports.getCurrentPreference = async (req, res) => {
  try {
    // Get user's employee ID
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    // Find latest month settings
    const latestMonth = await MonthlyWorkingHours.findOne({
      order: [['year', 'DESC'], ['month_number', 'DESC']]
    });
    
    if (!latestMonth) {
      return res.status(404).json({ error: 'No month settings found' });
    }
    
    console.log(`Found latest month: ${latestMonth.month_name} ${latestMonth.year}`);
    
    // Find existing preference
    const preference = await SchedulingPreference.findOne({
      where: {
        employee_id: employee.id,
        target_month: latestMonth.month_name,
        target_year: latestMonth.year
      },
      include: [
        { model: WeekdayPreference, as: 'weekdayPreferences' },
        { model: ExactDatePreference, as: 'exactDatePreferences' }
      ]
    });
    
    if (!preference) {
      // Return empty preference template
      return res.status(200).json({
        monthId: latestMonth.id,
        targetMonth: latestMonth.month_name,
        targetYear: latestMonth.year,
        weekdayPreferences: [],
        exactDatePreferences: []
      });
    }
    
    // Format the response
    const formattedPreference = {
      id: preference.id,
      monthId: latestMonth.id,
      employeeId: preference.employee_id,
      targetMonth: preference.target_month,
      targetYear: preference.target_year,
      weekdayPreferences: preference.weekdayPreferences.map(wp => ({
        dayOfWeek: wp.day_of_week,
        shiftPreference: wp.shift_preference
      })),
      exactDatePreferences: preference.exactDatePreferences.map(edp => ({
        exactDate: edp.exact_date.toISOString().split('T')[0],
        startTime: edp.start_time,
        endTime: edp.end_time
      }))
    };
    
    res.status(200).json(formattedPreference);
  } catch (error) {
    console.error('Error fetching current preference:', error);
    res.status(500).json({ error: 'Failed to fetch current preference' });
  }
};

/**
 * Submit preference for current user and latest month
 */
exports.submitCurrentPreference = async (req, res) => {
  try {
    const { weekdayPreferences, exactDatePreferences } = req.body;
    
    // Get user's employee ID
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    // Find latest month settings
    const latestMonth = await MonthlyWorkingHours.findOne({
      order: [['year', 'DESC'], ['month_number', 'DESC']]
    });
    
    if (!latestMonth) {
      return res.status(404).json({ error: 'No month settings found' });
    }
    
    console.log(`Found latest month for submission: ${latestMonth.month_name} ${latestMonth.year}`);
    
    // Submit with latest month
    return await submitPreferenceWithMonth(req, res, employee, latestMonth, weekdayPreferences, exactDatePreferences);
  } catch (error) {
    console.error('Error submitting current preference:', error);
    res.status(500).json({ error: 'Failed to submit current preference' });
  }
};

/**
 * Update preferences for a specific month
 */
exports.updatePreference = async (req, res) => {
  // Redirect to submit preference
  return exports.submitPreference(req, res);
};
// Добавьте эту функцию в контроллер preferences.controller.js
exports.getLatestMonth = async (req, res) => {
  try {
    // Найти последний месяц с правильным именем и номером
    const latestMonth = await MonthlyWorkingHours.findOne({
      where: {
        month_name: { [Op.ne]: null },
        month_number: { [Op.ne]: null }
      },
      order: [['year', 'DESC'], ['month_number', 'DESC']]
    });
    
    if (!latestMonth) {
      return res.status(404).json({ error: 'No valid month settings found' });
    }
    
    console.log(`Found latest month: ${latestMonth.month_name} ${latestMonth.year}`);
    
    res.status(200).json({
      id: latestMonth.id,
      monthName: latestMonth.month_name,
      monthNumber: latestMonth.month_number,
      year: latestMonth.year,
      targetHours: latestMonth.target_hours
    });
  } catch (error) {
    console.error('Error fetching latest month:', error);
    res.status(500).json({ error: 'Failed to fetch latest month' });
  }
};

// Модифицировать существующую функцию getAvailableMonths
exports.getAvailableMonths = async (req, res) => {
  try {
    // Получить только те месяцы, у которых есть имя и номер
    const availableMonths = await MonthlyWorkingHours.findAll({
      where: {
        month_name: { [Op.ne]: null },
        month_number: { [Op.ne]: null }
      },
      order: [['year', 'DESC'], ['month_number', 'ASC']]
    });
    
    if (!availableMonths || availableMonths.length === 0) {
      return res.status(404).json({ error: 'No valid months found' });
    }
    
    // Map to expected format
    const monthsData = availableMonths.map(month => ({
      id: month.id,
      monthName: month.month_name,
      monthNumber: month.month_number,
      year: month.year,
      targetHours: month.target_hours
    }));
    
    res.status(200).json(monthsData);
  } catch (error) {
    console.error('Error fetching available months:', error);
    res.status(500).json({ error: 'Failed to fetch available months' });
  }
};