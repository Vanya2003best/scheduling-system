const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/authMiddleware');

// Существующие маршруты
router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/refresh', userController.refreshToken);
router.post('/logout', userController.logout);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.put('/users/password', authMiddleware, userController.changePassword);
router.put('/users/profile', authMiddleware, userController.updateProfile);

module.exports = router;