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
    // Get user's employee ID
    const employee = await Employee.findOne({ where: { user_id: req.user.id } });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    // Get available months (e.g., current month + next 3 months)
    const availableMonths = await MonthlyWorkingHours.findAll({
      where: {
        // Custom query to get current and future months only
        // This is a simplified version, in a real application
        // we would use Sequelize's operators to filter by date
      },
      order: [['year', 'ASC'], ['month_number', 'ASC']]
    });
    
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
      return res.status(404).json({ error: 'Month not found' });
    }
    
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
        targetMonth: monthSettings.month_name,
        targetYear: monthSettings.year,
        weekdayPreferences: [],
        exactDatePreferences: []
      });
    }
    
    // Format the response
    const formattedPreference = {
      id: preference.id,
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
      return res.status(404).json({ error: 'Month not found' });
    }
    
    console.log(`Found month settings: ${monthSettings.month_name} ${monthSettings.year}`);
    
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
    console.error('Error submitting preference:', error);
    res.status(500).json({ error: 'Failed to submit preference' });
  }
};

/**
 * Get preferences by user ID
 */
exports.getPreferenceByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get employee info
    const employee = await Employee.findOne({ where: { user_id: userId } });
    
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
        employeeId: employee.id,
        targetMonth: latestMonth.month_name,
        targetYear: latestMonth.year,
        weekdayPreferences: [],
        exactDatePreferences: []
      });
    }
    
    // Format the response
    const formattedPreference = {
      id: preference.id,
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
    console.error('Error fetching preference by user:', error);
    res.status(500).json({ error: 'Failed to fetch preference' });
  }
};

/**
 * Submit preferences for a specific user
 */
exports.submitPreferenceByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { weekdayPreferences, exactDatePreferences, targetMonth, targetYear } = req.body;
    
    // Get employee info
    const employee = await Employee.findOne({ where: { user_id: userId } });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    // Find latest month settings if targetMonth and targetYear not provided
    let monthSettings;
    if (!targetMonth || !targetYear) {
      monthSettings = await MonthlyWorkingHours.findOne({
        order: [['year', 'DESC'], ['month_number', 'DESC']]
      });
      
      if (!monthSettings) {
        return res.status(404).json({ error: 'No month settings found' });
      }
    }
    
    const finalTargetMonth = targetMonth || monthSettings.month_name;
    const finalTargetYear = targetYear || monthSettings.year;
    
    console.log(`Submitting preference for: ${finalTargetMonth} ${finalTargetYear}`);
    
    // Create or update preference in a transaction
    const result = await sequelize.transaction(async (t) => {
      // Check if preference already exists
      let preference = await SchedulingPreference.findOne({
        where: {
          employee_id: employee.id,
          target_month: finalTargetMonth,
          target_year: finalTargetYear
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
          target_month: finalTargetMonth,
          target_year: finalTargetYear,
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
    console.error('Error submitting preference by user:', error);
    res.status(500).json({ error: 'Failed to submit preference' });
  }
};

/**
 * Update preferences for a specific month
 */
exports.updatePreference = async (req, res) => {
  // The implementation is very similar to submitPreference
  // In fact, submitPreference already handles both creation and update
  // So we can just call that function
  return exports.submitPreference(req, res);
};