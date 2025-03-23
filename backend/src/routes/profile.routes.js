const express = require('express');
const router = express.Router();
// Will implement controllers and middleware later

// Get user profile
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Get profile endpoint - to be implemented' });
});

// Update user profile
router.put('/', (req, res) => {
  res.status(200).json({ message: 'Update profile endpoint - to be implemented' });
});

module.exports = router;