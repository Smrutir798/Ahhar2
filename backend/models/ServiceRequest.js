const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  requestType: { type: String, required: true }, // "Call Waiter", "Water", "Tissue", "Cleaning", "Bill", "Custom"
  customMessage: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'completed'], default: 'pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
