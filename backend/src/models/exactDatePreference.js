const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ExactDatePreference extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      ExactDatePreference.belongsTo(models.SchedulingPreference, {
        foreignKey: 'preferenceId',
        as: 'schedulingPreference'
      });
    }
  }

  ExactDatePreference.init({
    preferenceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'scheduling_preferences',
        key: 'id'
      }
    },
    exactDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ExactDatePreference',
    tableName: 'exact_date_preferences',
    timestamps: true,
    underscored: true
  });

  return ExactDatePreference;
};