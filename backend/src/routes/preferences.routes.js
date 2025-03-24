const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferences.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Get available months for preference submission
router.get('/available-months', preferencesController.getAvailableMonths);

// Get the latest available month
router.get('/latest-month', preferencesController.getLatestMonth);

// Get preferences for current user and latest month
router.get('/current', preferencesController.getCurrentPreference);

// Submit preferences for current user and latest month
router.post('/current', preferencesController.submitCurrentPreference);

// Get preferences for a specific month
router.get('/:monthId', preferencesController.getPreference);

// Submit preferences for a specific month
router.post('/:monthId', preferencesController.submitPreference);

// Update preferences for a specific month
router.put('/:monthId', preferencesController.updatePreference);

module.exports = router;