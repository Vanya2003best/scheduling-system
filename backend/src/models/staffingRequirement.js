const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StaffingRequirement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // No specific associations for this model
    }
  }

  StaffingRequirement.init({
    dayOfWeek: {
      type: DataTypes.STRING,
      allowNull: false
    },
    hourOfDay: {
      type: DataTypes.STRING,
      allowNull: false
    },
    requiredEmployees: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    }
  }, {
    sequelize,
    modelName: 'StaffingRequirement',
    tableName: 'staffing_requirements',
    timestamps: true,
    underscored: true
  });

  return StaffingRequirement;
};