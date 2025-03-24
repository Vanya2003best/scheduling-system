const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Employee, {
        foreignKey: 'userId',
        as: 'employee'
      });
    }

    // Метод для проверки пароля
    async comparePassword(candidatePassword) {
      const storedPasswordHash = await this.reload({ attributes: ['password_hash'] })
        .then(user => user.get('password_hash'));
    
      console.log('Extensive Password Debugging:', {
        candidatePassword,
        storedPasswordHash,
        candidateType: typeof candidatePassword,
        hashType: typeof storedPasswordHash,
        candidateLength: candidatePassword.length,
        hashLength: storedPasswordHash.length
      });
    
      try {
        const result = await bcrypt.compare(candidatePassword, storedPasswordHash);
        
        console.log('Bcrypt Detailed Compare:', {
          match: result,
          candidatePassword,
          storedPasswordHash
        });
    
        return result;
      } catch (error) {
        console.error('Bcrypt Compare Catastrophic Error:', {
          message: error.message,
          stack: error.stack,
          candidatePassword,
          storedPasswordHash
        });
        return false;
      }
    }
    // Метод для безопасного обновления пароля
    async setPassword(newPassword) {
      const salt = await bcrypt.genSalt(10);
      this.password_hash = await bcrypt.hash(newPassword, salt);
      return this;
    }
  }

  User.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Пользователь с таким email уже существует'
      },
      validate: {
        isEmail: {
          msg: 'Некорректный формат email'
        },
        notNull: {
          msg: 'Email обязателен'
        }
      }
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Пароль обязателен'
        },
        len: {
          args: [8, 255],
          msg: 'Пароль должен содержать минимум 8 символов'
        }
      }
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'employee',
      validate: {
        isIn: {
          args: [['employee', 'admin', 'manager']],
          msg: 'Недопустимая роль пользователя'
        }
      }
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      validate: {
        isBoolean: {
          msg: 'is_active должно быть булевым значением'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user, options) => {
        // Проверяем, что пароль еще не захеширован
        if (user.password_hash && !user.password_hash.startsWith('$2b$')) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
      beforeUpdate: async (user, options) => {
        // Хешируем пароль только если он был изменен и не захеширован
        if (user.changed('password_hash') && !user.password_hash.startsWith('$2b$')) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      }
    },
    // Дополнительные настройки для безопасности
    defaultScope: {
      attributes: { 
        exclude: ['password_hash'] 
      }
    },
  });

  return User;
};