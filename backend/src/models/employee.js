const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      Employee.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      Employee.hasMany(models.SchedulingPreference, {
        foreignKey: 'employeeId',
        as: 'preferences'
      });

      Employee.hasMany(models.ScheduleEntry, {
        foreignKey: 'employeeId',
        as: 'scheduleEntries'
      });
    }
  }

  Employee.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false
    },
    department: {
      type: DataTypes.STRING
    },
    hireDate: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    timestamps: true,
    underscored: true
  });

  return Employee;
};