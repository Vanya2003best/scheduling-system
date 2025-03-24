const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferences.controller');
const { authenticate, isSelfOrAdmin } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Get available months for preference submission
router.get('/available-months', preferencesController.getAvailableMonths);

// Get preferences for a specific month
router.get('/:monthId', preferencesController.getPreference);

// Submit preferences for a specific month
router.post('/:monthId', preferencesController.submitPreference);

// Update preferences for a specific month
router.put('/:monthId', preferencesController.updatePreference);

// Get preferences for a specific user (added)
router.get('/user/:userId', isSelfOrAdmin, preferencesController.getPreferenceByUserId);

// Submit preferences for a specific user (added)
router.post('/user/:userId', isSelfOrAdmin, preferencesController.submitPreferenceByUserId);

module.exports = router;