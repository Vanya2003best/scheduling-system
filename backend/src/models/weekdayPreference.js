const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WeekdayPreference extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      WeekdayPreference.belongsTo(models.SchedulingPreference, {
        foreignKey: 'preferenceId',
        as: 'schedulingPreference'
      });
    }
  }

  WeekdayPreference.init({
    preferenceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'scheduling_preferences',
        key: 'id'
      }
    },
    dayOfWeek: {
      type: DataTypes.STRING,
      allowNull: false
    },
    shiftPreference: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'WeekdayPreference',
    tableName: 'weekday_preferences',
    timestamps: true,
    underscored: true
  });

  return WeekdayPreference;
};