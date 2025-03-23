const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Employee routes
router.get('/employees', adminController.getAllEmployees);

// We'll implement these later, but we've added the controller method for getAllEmployees
router.get('/employees/:employeeId', (req, res) => {
  res.status(200).json({ message: `Get employee ${req.params.employeeId} details - to be implemented` });
});

router.post('/employees', (req, res) => {
  res.status(201).json({ message: 'Create employee endpoint - to be implemented' });
});

router.put('/employees/:employeeId', (req, res) => {
  res.status(200).json({ message: `Update employee ${req.params.employeeId} - to be implemented` });
});

router.delete('/employees/:employeeId', (req, res) => {
  res.status(200).json({ message: `Delete employee ${req.params.employeeId} - to be implemented` });
});

// Schedule routes
router.get('/schedules', adminController.getAllSchedules);

// We'll implement this endpoint later
router.get('/schedules/:monthId', (req, res) => {
  res.status(200).json({ message: `Get schedule details for month ${req.params.monthId} - to be implemented` });
});

// We'll implement this endpoint later
router.get('/schedules/:monthId/employees/:employeeId', (req, res) => {
  res.status(200).json({ 
    message: `Get schedule for employee ${req.params.employeeId} in month ${req.params.monthId} - to be implemented` 
  });
});

router.post('/schedules/:monthId/generate', adminController.generateSchedule);

// We'll implement this endpoint later
router.put('/schedules/:monthId/employees/:employeeId/entries/:date', (req, res) => {
  res.status(200).json({ 
    message: `Update schedule entry for employee ${req.params.employeeId} on date ${req.params.date} - to be implemented` 
  });
});

router.post('/schedules/:monthId/publish', adminController.publishSchedule);

// Job status routes
router.get('/jobs/:jobId', adminController.checkJobStatus);

// Staffing requirements routes
router.get('/staffing-requirements', adminController.getStaffingRequirements);
router.put('/staffing-requirements', adminController.updateStaffingRequirements);

// Monthly working hours routes
router.get('/monthly-hours', adminController.getMonthlyHours);
router.put('/monthly-hours/:year/:monthNumber', adminController.updateMonthlyHours);

// We'll implement this endpoint later
router.get('/reports/schedules/:monthId', (req, res) => {
  res.status(200).json({ message: `Generate report for month ${req.params.monthId} - to be implemented` });
});

module.exports = router;