const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GeneratedSchedule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      GeneratedSchedule.hasMany(models.ScheduleEntry, {
        foreignKey: 'scheduleId',
        as: 'entries'
      });
      
      GeneratedSchedule.hasMany(models.EmployeeMonthlyHours, {
        foreignKey: 'scheduleId',
        as: 'monthlyHours'
      });
      
      GeneratedSchedule.hasMany(models.EmployeeWeeklyHours, {
        foreignKey: 'scheduleId',
        as: 'weeklyHours'
      });
      
      GeneratedSchedule.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
    }
  }

  GeneratedSchedule.init({
    monthName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    monthNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    generationTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'published', 'archived']]
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'GeneratedSchedule',
    tableName: 'generated_schedules',
    timestamps: true,
    underscored: true
  });

  return GeneratedSchedule;
};