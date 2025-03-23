const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeWeeklyHours extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      EmployeeWeeklyHours.belongsTo(models.GeneratedSchedule, {
        foreignKey: 'scheduleId',
        as: 'schedule'
      });
      
      EmployeeWeeklyHours.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      });
    }
  }

  EmployeeWeeklyHours.init({
    scheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'generated_schedules',
        key: 'id'
      }
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    weekNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 6
      }
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    totalHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'EmployeeWeeklyHours',
    tableName: 'employee_weekly_hours',
    timestamps: true,
    underscored: true
  });

  return EmployeeWeeklyHours;
};