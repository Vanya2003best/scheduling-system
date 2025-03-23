const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Logout user (protected route)
router.post('/logout', authenticate, authController.logout);

module.exports = router;