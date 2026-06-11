const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tableNumber: { type: Number, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied', 'billing'], default: 'available' },
  qrCodeUrl: { type: String } // Store the data URI or image URL of the QR code
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
