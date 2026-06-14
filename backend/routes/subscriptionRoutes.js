const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/auth'); 

// Route to get available plans
router.get('/plans', authMiddleware, subscriptionController.getPlans);

// Route to create a Razorpay order
router.post('/create-order', authMiddleware, subscriptionController.createOrder);

// Route to verify payment and activate subscription
router.post('/verify-payment', authMiddleware, subscriptionController.verifyPayment);

module.exports = router;
