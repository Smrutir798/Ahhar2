const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ServiceRequest = require('../models/ServiceRequest');
const Restaurant = require('../models/Restaurant');
const socket = require('../socket');

// Get all active service requests for the admin's restaurant
router.get('/', auth, async (req, res) => {
  try {
    let restaurantId = req.user.restaurantId;
    if (!restaurantId && (req.user.role === 'admin' || req.user.role === 'owner')) {
      const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
      if (restaurant) restaurantId = restaurant._id;
    }
    
    if (!restaurantId) return res.status(400).json({ message: 'No restaurant found' });
    
    const requests = await ServiceRequest.find({
      restaurantId,
      status: { $in: ['pending', 'accepted', 'completed'] } // Waiter dashboard needs all 3
    })
    .populate('tableId', 'tableNumber')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept service request
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'accepted', assignedTo: req.user.id },
      { new: true }
    ).populate('tableId', 'tableNumber').populate('assignedTo', 'name');
    
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    const io = socket.getIO();
    io.to(request.restaurantId.toString()).emit('service-request-accepted', request);
    io.to(request.sessionId.toString()).emit('service-request-accepted', request);
    
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark service request as completed
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    ).populate('tableId', 'tableNumber').populate('assignedTo', 'name');
    
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    const io = socket.getIO();
    io.to(request.restaurantId.toString()).emit('service-request-completed', request);
    io.to(request.sessionId.toString()).emit('service-request-completed', request);
    
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
