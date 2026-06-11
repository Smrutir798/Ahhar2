const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Bill = require('../models/Bill');
const Session = require('../models/Session');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const socket = require('../socket');

// Generate a bill for a session
router.post('/generate/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Check if bill already exists
    const existingBill = await Bill.findOne({ sessionId });
    if (existingBill) {
      return res.json(existingBill);
    }
    
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    // Fetch all non-cancelled orders for this session
    const orders = await Order.find({ sessionId, status: { $ne: 'cancelled' } });
    
    const subtotal = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Get tax settings from restaurant
    const restaurant = await Restaurant.findById(session.restaurantId);
    const taxes = restaurant?.taxSettings || { cgst: 2.5, sgst: 2.5, serviceCharge: 0 };
    
    const cgstAmount = (subtotal * taxes.cgst) / 100;
    const sgstAmount = (subtotal * taxes.sgst) / 100;
    const serviceChargeAmount = (subtotal * taxes.serviceCharge) / 100;
    
    const grandTotal = Math.round(subtotal + cgstAmount + sgstAmount + serviceChargeAmount);
    
    const billNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const newBill = new Bill({
      billNumber,
      sessionId,
      tableId: session.tableId,
      restaurantId: session.restaurantId,
      subtotal,
      cgst: cgstAmount,
      sgst: sgstAmount,
      serviceCharge: serviceChargeAmount,
      grandTotal,
      paymentStatus: 'pending'
    });
    
    await newBill.save();
    
    // Update table status to billing
    await Table.findByIdAndUpdate(session.tableId, { status: 'billing' });
    
    // Populate before emitting
    await newBill.populate('tableId', 'tableNumber');
    
    const io = socket.getIO();
    io.to(session.restaurantId.toString()).emit('new-bill', newBill);
    
    res.status(201).json(newBill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all bills for a restaurant (Admin/Cashier)
router.get('/:restaurantId', auth, async (req, res) => {
  try {
    const bills = await Bill.find({ restaurantId: req.params.restaurantId })
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark bill as paid
router.put('/:id/pay', auth, async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'paid', paymentMethod, paidAt: new Date() },
      { new: true }
    );
    
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    
    // Close the session
    await Session.findByIdAndUpdate(bill.sessionId, { status: 'closed', closedAt: new Date() });
    
    // Free the table
    await Table.findByIdAndUpdate(bill.tableId, { status: 'available' });
    
    // Delete table session cache (optional, but good practice if relying on socket for table clear)
    const io = socket.getIO();
    io.to(bill.restaurantId.toString()).emit('bill-paid', bill);
    io.to(bill.sessionId.toString()).emit('bill-paid', bill);
    io.to(bill.sessionId.toString()).emit('session-closed', bill);
    
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific bill (useful for customer preview)
router.get('/session/:sessionId', async (req, res) => {
  try {
    const bill = await Bill.findOne({ sessionId: req.params.sessionId })
      .populate('tableId', 'tableNumber')
      .populate({ path: 'restaurantId', select: 'name address phone gstNumber logo taxSettings' });
      
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
