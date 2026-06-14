const Restaurant = require('../models/Restaurant');

/**
 * Middleware to restrict access based on subscription plan.
 * @param {Array} allowedPlans - e.g., ['standard', 'premium']
 */
const requireFeature = (allowedPlans) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.restaurantId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Admins and superadmins bypass
      if (req.user.role === 'admin' || req.user.role === 'thinkdifferent') {
        return next();
      }

      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const activePlan = user.subscription?.plan || 'free';



      // If the current plan is in the allowed list, proceed
      if (allowedPlans.includes(activePlan)) {
        return next();
      }

      // Hierarchy: Premium > Standard > Basic
      if (activePlan === 'premium' || activePlan === 'standard') {
        return next(); // Premium and Standard have access to everything
      }

      return res.status(403).json({ 
        message: 'Feature not available on your current plan',
        requiresUpgrade: true
      });

    } catch (error) {
      console.error('requireFeature error:', error);
      res.status(500).json({ message: 'Server error checking feature access' });
    }
  };
};

module.exports = requireFeature;
