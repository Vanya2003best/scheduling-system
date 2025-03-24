const { sequelize } = require('../models');
const bcrypt = require('bcrypt');

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const DAYS_OF_WEEK = [
  'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'
];

const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const SHIFT_DEFINITIONS = [
  { name: 'Pierwsza zmiana', startTime: '07:00', endTime: '15:00', durationHours: 8, crossesMidnight: false },
  { name: 'Druga zmiana', startTime: '15:00', endTime: '23:00', durationHours: 8, crossesMidnight: false },
  { name: 'Nocka', startTime: '22:00', endTime: '06:00', durationHours: 8, crossesMidnight: true }
];

// Monthly working hours for 2024 and 2025 (example data)
const MONTHLY_HOURS = [
  // 2024
  { monthName: 'Styczeń', monthNumber: 1, year: 2024, targetHours: 168 },
  { monthName: 'Luty', monthNumber: 2, year: 2024, targetHours: 160 },
  { monthName: 'Marzec', monthNumber: 3, year: 2024, targetHours: 168 },
  { monthName: 'Kwiecień', monthNumber: 4, year: 2024, targetHours: 168 },
  { monthName: 'Maj', monthNumber: 5, year: 2024, targetHours: 168 },
  { monthName: 'Czerwiec', monthNumber: 6, year: 2024, targetHours: 160 },
  { monthName: 'Lipiec', monthNumber: 7, year: 2024, targetHours: 184 },
  { monthName: 'Sierpień', monthNumber: 8, year: 2024, targetHours: 168 },
  { monthName: 'Wrzesień', monthNumber: 9, year: 2024, targetHours: 168 },
  { monthName: 'Październik', monthNumber: 10, year: 2024, targetHours: 184 },
  { monthName: 'Listopad', monthNumber: 11, year: 2024, targetHours: 152 },
  { monthName: 'Grudzień', monthNumber: 12, year: 2024, targetHours: 168 },
  // 2025
  { monthName: 'Styczeń', monthNumber: 1, year: 2025, targetHours: 176 },
  { monthName: 'Luty', monthNumber: 2, year: 2025, targetHours: 160 },
  { monthName: 'Marzec', monthNumber: 3, year: 2025, targetHours: 168 },
  { monthName: 'Kwiecień', monthNumber: 4, year: 2025, targetHours: 168 },
  { monthName: 'Maj', monthNumber: 5, year: 2025, targetHours: 168 },
  { monthName: 'Czerwiec', monthNumber: 6, year: 2025, targetHours: 168 },
  { monthName: 'Lipiec', monthNumber: 7, year: 2025, targetHours: 184 },
  { monthName: 'Sierpień', monthNumber: 8, year: 2025, targetHours: 160 },
  { monthName: 'Wrzesień', monthNumber: 9, year: 2025, targetHours: 176 },
  { monthName: 'Październik', monthNumber: 10, year: 2025, targetHours: 176 },
  { monthName: 'Listopad', monthNumber: 11, year: 2025, targetHours: 160 },
  { monthName: 'Grudzień', monthNumber: 12, year: 2025, targetHours: 168 }
];

// Example staffing requirements (basic template)
const generateStaffingRequirements = () => {
  const requirements = [];
  
  DAYS_OF_WEEK.forEach(day => {
    HOURS_OF_DAY.forEach(hour => {
      // Base staffing levels - actual requirements would be configured by admin
      let requiredEmployees = 2; // Default value
      
      // Example: More staff during work hours on weekdays
      if (day !== 'Sobota' && day !== 'Niedziela') {
        if (hour >= '08:00' && hour <= '17:00') {
          requiredEmployees = 5;
        }
      }
      
      // Example: Reduced staffing at night
      if (hour >= '22:00' || hour < '06:00') {
        requiredEmployees = 1;
      }
      
      requirements.push({
        dayOfWeek: day,
        hourOfDay: hour,
        requiredEmployees
      });
    });
  });
  
  return requirements;
};

// Initialize database with seed data
const initDb = async () => {
  try {
    // Sync database models
    console.log('Syncing database models...');
    await sequelize.sync({ force: true });
    console.log('Database models synced successfully.');
    
    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await sequelize.models.User.create({
      email: 'admin@example.com',
      password_hash: hashedPassword,
      role: 'admin',
      isActive: true,
      lastLogin: new Date()
    });
    
    await sequelize.models.Employee.create({
      userId: adminUser.id,
      firstName: 'Admin',
      lastName: 'User',
      position: 'Administrator',
      department: 'Management',
      hireDate: new Date()
    });
    
    console.log('Admin user created successfully.');
    
    // Create regular employee
    console.log('Creating employee user...');
    const employeePassword = await bcrypt.hash('employee123', 10);
    const employeeUser = await sequelize.models.User.create({
      email: 'employee@example.com',
      password: employeePassword,
      role: 'employee',
      isActive: true,
      lastLogin: new Date()
    });
    
    await sequelize.models.Employee.create({
      userId: employeeUser.id,
      firstName: 'Jan',
      lastName: 'Kowalski',
      position: 'Specialist',
      department: 'Operations',
      hireDate: new Date('2023-01-15')
    });
    
    console.log('Employee user created successfully.');
    
    // Seed monthly working hours
    console.log('Seeding monthly working hours...');
    await sequelize.models.MonthlyWorkingHours.bulkCreate(MONTHLY_HOURS);
    console.log('Monthly working hours seeded successfully.');
    
    // Seed staffing requirements
    console.log('Seeding staffing requirements...');
    await sequelize.models.StaffingRequirement.bulkCreate(generateStaffingRequirements());
    console.log('Staffing requirements seeded successfully.');
    
    console.log('Database initialization completed successfully!');
    
    // Provide login instructions
    console.log('\nYou can now log in with the following credentials:');
    console.log('Admin:    email = admin@example.com,    password = admin123');
    console.log('Employee: email = employee@example.com, password = employee123');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
};

// Run the initialization
initDb();