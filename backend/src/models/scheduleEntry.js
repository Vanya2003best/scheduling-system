const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ScheduleEntry extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      ScheduleEntry.belongsTo(models.GeneratedSchedule, {
        foreignKey: 'scheduleId',
        as: 'schedule'
      });
      
      ScheduleEntry.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      });
    }
  }

  ScheduleEntry.init({
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
    scheduleDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    dayOfWeek: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: true
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isDayOff: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isFixedShift: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    shiftDurationHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    lastModifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'ScheduleEntry',
    tableName: 'schedule_entries',
    timestamps: true,
    underscored: true
  });

  return ScheduleEntry;
};