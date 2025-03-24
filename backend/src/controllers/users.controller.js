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

    // ВАЖНО: В модели используется password_hash, а не password
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