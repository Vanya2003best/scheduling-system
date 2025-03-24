const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferences.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Get available months for preference submission
router.get('/available-months', preferencesController.getAvailableMonths);

// Отладочный маршрут для просмотра месяцев
router.get('/debug-months', async (req, res) => {
    try {
      const { MonthlyWorkingHours } = require('../models');
      const months = await MonthlyWorkingHours.findAll();
      res.json(months);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// Get preferences for a specific user
router.get('/user/:userId', preferencesController.getPreference);

// Submit preferences for a specific user
router.post('/user/:userId', preferencesController.submitPreference);

// Update preferences for a specific user
router.put('/user/:userId', preferencesController.updatePreference);

module.exports = router;