const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Employee } = require('../models');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Should be in env in production
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, position, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in transaction
    const result = await sequelize.transaction(async (t) => {
      // Create user
      const newUser = await User.create({
        email,
        password_hash: hashedPassword,
        role: 'employee', // Default role
      }, { transaction: t });

      // Create employee profile
      const newEmployee = await Employee.create({
        user_id: newUser.id,
        first_name: firstName,
        last_name: lastName,
        position: position || 'Employee',
        department: department || 'General',
        hire_date: new Date(),
      }, { transaction: t });

      return { user: newUser, employee: newEmployee };
    });

    // Generate tokens
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

    // Send response (excluding sensitive data)
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
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Employee }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Your account has been deactivated' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
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
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.Employee ? user.Employee.first_name : null,
        lastName: user.Employee ? user.Employee.last_name : null,
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Employee }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Your account has been deactivated' });
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
      message: 'Token refreshed successfully',
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'An error occurred during token refresh' });
  }
};

// Logout user
exports.logout = (req, res) => {
  // In a stateless JWT auth system, the client is responsible for token deletion
  // The server doesn't need to do anything special for logout
  // We just return a successful response
  res.status(200).json({ message: 'Logout successful' });
};