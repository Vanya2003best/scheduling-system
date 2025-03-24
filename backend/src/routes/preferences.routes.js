const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferences.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { MonthlyWorkingHours } = require('../models');

// All routes require authentication
router.use(authenticate);

// Get available months for preference submission
router.get('/available-months', preferencesController.getAvailableMonths);

// Отладочный маршрут для просмотра месяцев
router.get('/debug-months', async (req, res) => {
    try {
      const months = await MonthlyWorkingHours.findAll();
      res.json(months);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// Get preferences for a specific user
router.get('/:userId', preferencesController.getPreferenceByUserId);

// Submit preferences for a specific user
router.post('/:userId', preferencesController.submitPreferenceByUserId);

// Update preferences for a specific user
router.put('/:userId', preferencesController.updatePreferenceByUserId);

module.exports = router;