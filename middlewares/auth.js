// Auth middleware stub
const jwt = require('jsonwebtoken');

// Generate token function
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fake-jwt-secret', {
    expiresIn: '30d'
  });
};

// Middleware factory functions
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fake-jwt-secret');
    req.user = { _id: decoded.id };
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

const requireVendorPermission = (req, res, next) => {
  // For now, just check if user is authenticated
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // In a real implementation, check for specific vendor permissions
  req.user.permissions = ['manage_vendors'];
  next();
};

const handleError = (error, req, res, next) => {
  console.error('API Error:', error);
  
  // Handle validation errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Handle other errors
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message
  });
};

const extractRequestMetadata = (req) => {
  return {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || 'Unknown',
    timestamp: new Date()
  };
};

module.exports = {
  generateToken,
  authenticateToken,
  requireVendorPermission,
  handleError,
  extractRequestMetadata,
  authMiddleware: {
    authenticateToken,
    requireVendorPermission
  }
};