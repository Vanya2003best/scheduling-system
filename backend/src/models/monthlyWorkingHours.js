const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MonthlyWorkingHours extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // No specific associations for this model
    }
  }

  MonthlyWorkingHours.init({
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
    targetHours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    }
  }, {
    sequelize,
    modelName: 'MonthlyWorkingHours',
    tableName: 'monthly_working_hours',
    timestamps: true,
    underscored: true
  });

  return MonthlyWorkingHours;
};