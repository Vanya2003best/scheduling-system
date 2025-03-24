// src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

// Импортируем контроллер для пользователей (создадим его следующим)
const usersController = require('../controllers/users.controller');

// Маршрут для изменения пароля (защищенный аутентификацией)
router.put('/password', authenticate, usersController.updatePassword);

module.exports = router;