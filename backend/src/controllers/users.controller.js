const bcrypt = require('bcrypt');
const { User } = require('../models');

/**
 * Обновление пароля пользователя
 */
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Находим пользователя с полным набором атрибутов
    const user = await User.findByPk(userId, {
      attributes: { include: ['password_hash'] } // Явно запрашиваем поле password_hash
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Логируем доступные поля пользователя для отладки
    console.log('User object keys:', Object.keys(user.dataValues));
    console.log('Password field check:', {
      hasPasswordField: user.password !== undefined,
      hasPasswordHashField: user.password_hash !== undefined
    });

    // Проверяем наличие пароля
    if (!user.password_hash) {
      console.log('No password_hash found for user:', userId);
      return res.status(400).json({ error: 'Не удалось получить текущий пароль пользователя' });
    }

    // Проверяем текущий пароль
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }

    // Проверяем требования к новому паролю
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Пароль должен содержать не менее 8 символов' });
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Обновляем пароль
    await user.update({ password_hash: hashedPassword });

    res.status(200).json({ message: 'Пароль успешно обновлен' });
  } catch (error) {
    console.error('Ошибка при обновлении пароля:', error);
    res.status(500).json({ error: 'Не удалось обновить пароль' });
  }
};