const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');

// Submit feedback (Customer facing, no auth needed typically, but keeping it open)
router.post('/', async (req, res) => {
  try {
    const { sessionId, tableId, restaurantId, foodRating, serviceRating, cleanlinessRating, comments } = req.body;
    
    const feedback = new Feedback({
      sessionId,
      tableId,
      restaurantId,
      foodRating,
      serviceRating,
      cleanlinessRating,
      comments
    });
    
    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feedback for a restaurant (Admin)
router.get('/:restaurantId', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ restaurantId: req.params.restaurantId })
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
