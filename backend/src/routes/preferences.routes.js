const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferences.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Get available months for preference submission
router.get('/available-months', preferencesController.getAvailableMonths);

// Get preferences for a specific month
router.get('/:monthId', preferencesController.getPreference);

router.get('/debug-months', async (req, res) => {
    try {
      const months = await sequelize.models.MonthlyWorkingHours.findAll();
      res.json(months);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// Submit preferences for a specific month
router.post('/:monthId', preferencesController.submitPreference);

// Update preferences for a specific month
router.put('/:monthId', preferencesController.updatePreference);

module.exports = router;