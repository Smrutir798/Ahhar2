const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const authMiddleware = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');

router.get('/', authMiddleware, restaurantController.getRestaurant);
router.put('/', authMiddleware, restaurantController.updateRestaurant);

// Update tax settings
router.put('/:id/taxes', authMiddleware, async (req, res) => {
  try {
    const { taxSettings } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { taxSettings },
      { new: true }
    );
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
