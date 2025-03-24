const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SchedulingPreference extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      SchedulingPreference.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      });
      
      SchedulingPreference.hasMany(models.WeekdayPreference, {
        foreignKey: 'preferenceId',
        as: 'weekdayPreferences' // Это имя должно совпадать с тем, что используется в контроллере
      });
      
      SchedulingPreference.hasMany(models.ExactDatePreference, {
        foreignKey: 'preferenceId',
        as: 'exactDatePreferences' // Это имя должно совпадать с тем, что используется в контроллере
      });
    }
  }

  SchedulingPreference.init({
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    targetMonth: {
      type: DataTypes.STRING,
      allowNull: false
    },
    targetYear: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    submissionTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'SchedulingPreference',
    tableName: 'scheduling_preferences',
    timestamps: true,
    underscored: true
  });

  return SchedulingPreference;
};