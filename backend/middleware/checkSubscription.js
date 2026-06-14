const Restaurant = require('../models/Restaurant');

const checkSubscription = async (req, res, next) => {
  try {
    // Assuming req.user contains the authenticated user and their restaurantId
    // If the user is an admin or superadmin, they might bypass this. We'll check for restaurant roles.
    
    // We only enforce this for users who belong to a restaurant
    if (!req.user || !req.user.restaurantId) {
      return next(); 
    }

    // Admins or thinkdifferent role can bypass
    if (req.user.role === 'admin' || req.user.role === 'thinkdifferent') {
       return next();
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    
    if (user.subscription?.status !== 'active' || now > (user.subscription?.validUntil || new Date(0))) {
      // Update status in DB if it was active but expired
      if (user.subscription?.status === 'active') {
          user.subscription.status = 'expired';
          await user.save();
      }
      return res.status(403).json({ 
        message: 'Subscription Expired', 
        expired: true,
        redirectUrl: '/subscription' // Frontend can use this to redirect
      });
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ message: 'Server Error during subscription check' });
  }
};

module.exports = checkSubscription;
