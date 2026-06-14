const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Bearer <token>

  if (!token || token === 'undefined' || token === 'null') {
    console.log('AuthMiddleware: No token provided or token is undefined string', { token: req.header('Authorization') });
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = decoded; // Contains id and role
    
    // Ensure restaurantId is populated for old tokens
    if (!req.user.restaurantId && (req.user.role === 'admin' || req.user.role === 'owner')) {
      const Restaurant = require('../models/Restaurant');
      const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
      if (restaurant) {
        req.user.restaurantId = restaurant._id.toString();
      }
    }

    next();
  } catch (err) {
    console.log('AuthMiddleware: Token validation failed', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
