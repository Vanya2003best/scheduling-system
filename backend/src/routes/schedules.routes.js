const express = require('express');
const router = express.Router();
const schedulesController = require('../controllers/schedules.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Get all available schedules
router.get('/', schedulesController.getAllSchedules);

// Get schedule for the current user
router.get('/:monthId', schedulesController.getSchedule);

module.exports = router;