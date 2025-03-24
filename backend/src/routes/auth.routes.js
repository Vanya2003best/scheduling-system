const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Существующие маршруты
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Новые маршруты для сброса пароля
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;