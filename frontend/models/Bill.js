const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billNumber: { type: String, required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  
  subtotal: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  serviceCharge: { type: Number, default: 0 },
  
  grandTotal: { type: Number, required: true },
  
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'card', ''], default: '' },
  
  generatedAt: { type: Date, default: Date.now },
  paidAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
