// syncDb.js
const { sequelize } = require('./src/models');

async function syncDb() {
  try {
    console.log('Синхронизируем модели с базой данных...');
    await sequelize.sync({ alter: true }); // alter:true обновит существующие таблицы
    console.log('Синхронизация выполнена успешно');
  } catch (error) {
    console.error('Ошибка синхронизации:', error);
  } finally {
    await sequelize.close();
  }
}

syncDb();