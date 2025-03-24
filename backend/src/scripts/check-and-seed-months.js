// Скрипт для проверки и заполнения таблицы MonthlyWorkingHours, если она пуста
// Сохраните этот код как check-and-seed-months.js в папке backend/src/scripts/

const { sequelize, MonthlyWorkingHours } = require('../models');

const MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

async function checkAndSeedMonths() {
  try {
    console.log('Checking if MonthlyWorkingHours table has data...');
    
    // Проверяем, есть ли записи в таблице
    const count = await MonthlyWorkingHours.count();
    
    if (count > 0) {
      console.log(`Found ${count} records in MonthlyWorkingHours table. No seeding needed.`);
      return;
    }
    
    console.log('MonthlyWorkingHours table is empty. Seeding current and next months...');
    
    // Получаем текущую дату
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    // Создаем записи для текущего и следующих месяцев
    const monthsToCreate = [];
    
    // Добавляем текущий месяц и 11 следующих (всего год)
    for (let i = 0; i < 12; i++) {
      const month = (currentMonth + i) % 12;
      const year = currentYear + Math.floor((currentMonth + i) / 12);
      
      monthsToCreate.push({
        month_name: MONTHS[month],
        month_number: month + 1, // месяцы в нашей системе 1-12
        year: year,
        target_hours: 168 // значение по умолчанию, можно настроить под каждый месяц
      });
    }
    
    // Сохраняем записи в базу данных
    await MonthlyWorkingHours.bulkCreate(monthsToCreate);
    
    console.log(`Successfully seeded ${monthsToCreate.length} months.`);
    
    // Проверяем, что данные действительно добавились
    const newCount = await MonthlyWorkingHours.count();
    console.log(`Current count of records in MonthlyWorkingHours table: ${newCount}`);
    
    // Выводим созданные записи для проверки
    const months = await MonthlyWorkingHours.findAll({
      order: [['year', 'ASC'], ['month_number', 'ASC']]
    });
    
    console.log('Created months:');
    months.forEach(month => {
      console.log(`ID: ${month.id}, ${month.month_name} ${month.year} (${month.month_number}), Target hours: ${month.target_hours}`);
    });
    
  } catch (error) {
    console.error('Error checking and seeding months:', error);
  } finally {
    // Закрываем соединение с базой данных
    await sequelize.close();
  }
}

// Запускаем функцию
checkAndSeedMonths();

// Чтобы запустить этот скрипт, выполните команду:
// node src/scripts/check-and-seed-months.js