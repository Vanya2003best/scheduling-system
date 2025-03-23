const express = require('express');
const router = express.Router();
// Will implement controllers and middleware later

// Get all notifications for the current user
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Get notifications endpoint - to be implemented' });
});

// Mark a notification as read
router.put('/:notificationId', (req, res) => {
  res.status(200).json({ message: `Mark notification ${req.params.notificationId} as read - to be implemented` });
});

// Mark all notifications as read
router.put('/read-all', (req, res) => {
  res.status(200).json({ message: 'Mark all notifications as read endpoint - to be implemented' });
});

module.exports = router;