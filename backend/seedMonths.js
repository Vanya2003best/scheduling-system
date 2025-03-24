async function seedMonths() {
  try {
    console.log('Начинаем заполнение таблицы monthly_working_hours...');

    // 2024 months
    const months2024 = [
      { month_name: 'January', month_number: 1, year: 2024, target_hours: 168 },
      { month_name: 'February', month_number: 2, year: 2024, target_hours: 160 },
      { month_name: 'March', month_number: 3, year: 2024, target_hours: 168 },
      { month_name: 'April', month_number: 4, year: 2024, target_hours: 168 },
      { month_name: 'May', month_number: 5, year: 2024, target_hours: 168 },
      { month_name: 'June', month_number: 6, year: 2024, target_hours: 168 },
      { month_name: 'July', month_number: 7, year: 2024, target_hours: 168 },
      { month_name: 'August', month_number: 8, year: 2024, target_hours: 168 },
      { month_name: 'September', month_number: 9, year: 2024, target_hours: 168 },
      { month_name: 'October', month_number: 10, year: 2024, target_hours: 168 },
      { month_name: 'November', month_number: 11, year: 2024, target_hours: 168 },
      { month_name: 'December', month_number: 12, year: 2024, target_hours: 168 },
    ];

    // 2025 months
    const months2025 = [
      { month_name: 'January', month_number: 1, year: 2025, target_hours: 168 },
      { month_name: 'February', month_number: 2, year: 2025, target_hours: 160 },
      { month_name: 'March', month_number: 3, year: 2025, target_hours: 176 },
      { month_name: 'April', month_number: 4, year: 2025, target_hours: 168 },
      { month_name: 'May', month_number: 5, year: 2025, target_hours: 176 },
      { month_name: 'June', month_number: 6, year: 2025, target_hours: 168 },
      { month_name: 'July', month_number: 7, year: 2025, target_hours: 176 },
      { month_name: 'August', month_number: 8, year: 2025, target_hours: 168 },
      { month_name: 'September', month_number: 9, year: 2025, target_hours: 168 },
      { month_name: 'October', month_number: 10, year: 2025, target_hours: 176 },
      { month_name: 'November', month_number: 11, year: 2025, target_hours: 168 },
      { month_name: 'December', month_number: 12, year: 2025, target_hours: 176 },
    ];

    // Объединяем месяцы двух лет
    const allMonths = [...months2024, ...months2025];

    // Вставляем данные в базу данных через bulkCreate
    await MonthlyWorkingHours.bulkCreate(allMonths);

    console.log('Таблица monthly_working_hours успешно заполнена!');
  } catch (error) {
    console.error('Ошибка при заполнении таблицы:', error);
  }
}
