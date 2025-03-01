const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Authentication middleware
 * Verifies JWT token in the request header
 */
module.exports = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Set user ID in request
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
