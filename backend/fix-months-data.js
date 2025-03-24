// fix-months-data.js
const { MonthlyWorkingHours, sequelize } = require('./src/models');

const MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

async function fixMonthsData() {
  try {
    // Получаем все записи
    const months = await MonthlyWorkingHours.findAll();
    
    console.log(`Found ${months.length} records to update`);
    
    // Обновляем каждую запись с правильными данными
    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const monthNumber = i % 12 + 1; // 1-12
      const monthName = MONTHS[monthNumber - 1];
      
      console.log(`Updating record ID ${month.id}: Setting month_name=${monthName}, month_number=${monthNumber}`);
      
      await month.update({
        month_name: monthName,
        month_number: monthNumber
      });
    }
    
    console.log('All records updated successfully');
    
    // Проверяем обновленные данные
    const updatedMonths = await MonthlyWorkingHours.findAll({
      order: [['year', 'ASC'], ['month_number', 'ASC']]
    });
    
    console.log('Updated months:');
    updatedMonths.forEach(month => {
      console.log(`ID: ${month.id}, ${month.month_name} (${month.month_number}), ${month.year}`);
    });
    
  } catch (error) {
    console.error('Error fixing months data:', error);
  } finally {
    await sequelize.close();
  }
}

fixMonthsData();