const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeMonthlyHours extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      EmployeeMonthlyHours.belongsTo(models.GeneratedSchedule, {
        foreignKey: 'scheduleId',
        as: 'schedule'
      });
      
      EmployeeMonthlyHours.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      });
    }
  }

  EmployeeMonthlyHours.init({
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
    totalHours: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'EmployeeMonthlyHours',
    tableName: 'employee_monthly_hours',
    timestamps: true,
    underscored: true
  });

  return EmployeeMonthlyHours;
};