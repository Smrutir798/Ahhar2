const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  totalAmount: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  closedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
