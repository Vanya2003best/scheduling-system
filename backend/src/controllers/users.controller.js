const bcrypt = require('bcrypt');
const { User } = require('../models');

/**
 * Обновление пароля пользователя
 */
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Находим пользователя
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Проверяем текущий пароль
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }

    // Проверяем требования к новому паролю
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Пароль должен содержать не менее 8 символов' });
    }

    // Обновляем пароль
    user.password = newPassword; // Хук beforeUpdate в модели User автоматически хеширует пароль
    await user.save();

    res.status(200).json({ message: 'Пароль успешно обновлен' });
  } catch (error) {
    console.error('Ошибка при обновлении пароля:', error);
    res.status(500).json({ error: 'Не удалось обновить пароль' });
  }
};