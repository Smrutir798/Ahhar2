const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const socket = require('../socket');
const auth = require('../middleware/auth');

// Kitchen Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    if (user.role !== 'kitchen') {
      return res.status(403).json({ message: 'Access denied. Not a kitchen user.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id, role: user.role, restaurantId: user.restaurantId }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
    
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Active Orders (Pending, Accepted, Preparing, Ready) - Oldest first
router.get('/orders/:restaurantId', auth, async (req, res) => {
  try {
    const orders = await Order.find({ 
      restaurantId: req.params.restaurantId,
      status: { $ne: 'served' }
    })
    .populate('tableId', 'tableNumber')
    .sort({ createdAt: 1 }); // 1 for ascending (oldest first)
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Order Status
router.put('/orders/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const updateData = { status };
    if (status === 'preparing') updateData.preparingAt = new Date();
    if (status === 'ready') updateData.readyAt = new Date();

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Emit event to kitchen dashboard to sync across devices
    const io = socket.getIO();
    io.to(order.restaurantId.toString()).emit('order-updated', order);
    
    // Emit event to specific session so customer sees live update
    io.to(order.sessionId.toString()).emit('order-status-changed', order);
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Route: Create Kitchen Staff (Requires Admin Auth)
router.post('/staff', auth, async (req, res) => {
  try {
    // Only owner/admin can create kitchen staff
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { name, email, password, restaurantId } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'kitchen'
    });
    // Dynamically adding restaurantId field (will need schema update)
    newUser.set('restaurantId', restaurantId);
    
    await newUser.save();
    res.status(201).json({ message: 'Kitchen staff created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
