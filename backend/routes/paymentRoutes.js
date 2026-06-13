const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Bill = require('../models/Bill');
const Session = require('../models/Session');
const Table = require('../models/Table');
const socket = require('../socket');

// Helper to get razorpay instance dynamically
const getRazorpayInstance = () => {
  require('dotenv').config({ override: true }); // Dynamically re-read .env to catch manual edits without server restart!
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// @route   POST /api/payments/create-order
// @desc    Create a Razorpay order from a Bill
router.post('/create-order', async (req, res) => {
  try {
    const { billId } = req.body;
    
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Bill is already paid' });
    }

    // Razorpay amount is in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(bill.grandTotal * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: bill.billNumber
    };

    const rzp = getRazorpayInstance();
    const order = await rzp.orders.create(options);
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: 'Error creating payment order' });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment signature and mark bill as paid
router.post('/verify', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      billId 
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment is successful, update bill
      const bill = await Bill.findByIdAndUpdate(
        billId,
        { 
          paymentStatus: 'paid', 
          paymentMethod: 'razorpay', 
          paidAt: new Date(),
          transactionId: razorpay_payment_id
        },
        { new: true }
      );

      if (!bill) {
         return res.status(404).json({ message: 'Bill not found' });
      }

      // Close the session
      await Session.findByIdAndUpdate(bill.sessionId, { status: 'closed', closedAt: new Date() });
      
      // Free the table
      await Table.findByIdAndUpdate(bill.tableId, { status: 'available' });
      
      // Emit websocket events to clear the UI
      const io = socket.getIO();
      io.to(bill.restaurantId.toString()).emit('bill-paid', bill);
      io.to(bill.sessionId.toString()).emit('bill-paid', bill);
      io.to(bill.sessionId.toString()).emit('session-closed', bill);

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: 'Server error during payment verification' });
  }
});

module.exports = router;
