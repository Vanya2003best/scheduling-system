const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const { User, Employee, PasswordResetToken, sequelize } = require('../models');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// Настройка почтового транспорта
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Функция создания токена сброса пароля
async function createPasswordResetToken(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  await PasswordResetToken.create({
    userId: user.id,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 3600000) // 1 час
  });
  
  return token;
}

// Функция отправки письма
async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Сброс пароля',
    html: `
      <h1>Сброс пароля</h1>
      <p>Вы запросили сброс пароля. Перейдите по ссылке ниже:</p>
      <a href="${resetUrl}">Сбросить пароль</a>
      <p>Ссылка действительна 1 час.</p>
    `
  });
}

// Контроллер для запроса сброса пароля
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Найти пользователя
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ 
        error: 'Пользователь с таким email не найден' 
      });
    }
    
    // Создаем токен сброса пароля
    const resetToken = await createPasswordResetToken(user);
    
    // Отправляем email
    await sendPasswordResetEmail(email, resetToken);
    
    res.status(200).json({ 
      message: 'Инструкции по сбросу пароля отправлены на email' 
    });
  } catch (error) {
    console.error('Ошибка при запросе сброса пароля:', error);
    res.status(500).json({ 
      error: 'Не удалось обработать запрос на сброс пароля',
      details: error.message 
    });
  }
};

// Контроллер для сброса пароля
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const resetTokenRecord = await PasswordResetToken.findOne({
      where: { 
        token: hashedToken,
        expiresAt: { [Op.gt]: new Date() }
      },
      include: [{ model: User }]
    });
    
    if (!resetTokenRecord) {
      return res.status(400).json({ 
        error: 'Недействительный или просроченный токен' 
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Пароль должен быть не короче 8 символов' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await resetTokenRecord.User.update({ 
      password_hash: hashedPassword // Изменено с password на password_hash
    });
    
    await resetTokenRecord.destroy();
    
    res.status(200).json({ 
      message: 'Пароль успешно обновлен' 
    });
  } catch (error) {
    console.error('Ошибка при сбросе пароля:', error);
    res.status(500).json({ error: 'Не удалось сбросить пароль' });
  }
};

// Register
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, position, department } = req.body;

    // Проверка обязательных полей
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    // Проверка существующего пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Создание пользователя в транзакции
    const result = await sequelize.transaction(async (t) => {
      // Создаем пользователя
      const newUser = await User.create({
        email,
        password_hash: await bcrypt.hash(password, 10),
        role: 'employee', 
        is_active: true,
      }, { transaction: t });

      // Создаем профиль сотрудника с snake_case полями
      const newEmployee = await Employee.create({
        user_id: newUser.id,  // Используем id только что созданного пользователя
        first_name: firstName,
        last_name: lastName,
        position: position || 'Employee',
        department: department || 'General',
        hire_date: new Date(),
      }, { transaction: t });

      return { user: newUser, employee: newEmployee };
    });

    // Генерация токенов
    const token = jwt.sign(
      { 
        id: result.user.id, 
        email: result.user.email, 
        role: result.user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: result.user.id }, 
      JWT_SECRET, 
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Отправка ответа
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        firstName: result.employee.first_name,
        lastName: result.employee.last_name,
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ 
      error: 'An error occurred during registration', 
      details: error.message 
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login Attempt Verbose:', { 
      email, 
      passwordLength: password.length,
      passwordFirstChars: password.slice(0, 3) + '...' 
    });

    const user = await User.findOne({
      where: { email },
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });

    if (!user) {
      console.warn(`No user found with email: ${email}`);
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверка пароля с расширенной отладкой
    const isPasswordValid = await user.comparePassword(password);
    
    console.log('Detailed Password Validation:', {
      email,
      isValid: isPasswordValid,
      userId: user.id
    });

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate tokens
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: user.id }, 
      JWT_SECRET, 
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Send response
    res.status(200).json({
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.employee ? user.employee.first_name : null,
        lastName: user.employee ? user.employee.last_name : null,
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Произошла ошибка при входе', details: error.message });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh токен обязателен' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id, {
      include: [{ 
        model: Employee,
        as: 'employee'
      }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Недействительный токен' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Ваш аккаунт деактивирован' });
    }

    // Generate new tokens
    const newToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRY }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id }, 
      JWT_SECRET, 
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Send response
    res.status(200).json({
      message: 'Токен успешно обновлен',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.employee ? user.employee.first_name : null,
        lastName: user.employee ? user.employee.last_name : null,
      },
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Недействительный или просроченный токен' });
    }
    
    console.error('Ошибка обновления токена:', error);
    res.status(500).json({ error: 'Произошла ошибка при обновлении токена', details: error.message });
  }
};

// Logout user
exports.logout = (req, res) => {
  res.status(200).json({ message: 'Выход выполнен успешно' });
};