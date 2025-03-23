const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Should be in env in production

/**
 * Middleware to check if user is authenticated
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Your account has been deactivated' });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Middleware to check if user has admin role
 */
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

/**
 * Middleware to check if user is accessing their own data or is an admin
 */
exports.isSelfOrAdmin = (req, res, next) => {
  // The userId parameter is expected in the route params
  const userId = parseInt(req.params.userId);
  
  if (
    req.user && 
    (req.user.id === userId || req.user.role === 'admin')
  ) {
    next();
  } else {
    res.status(403).json({ error: 'You can only access your own data' });
  }
};