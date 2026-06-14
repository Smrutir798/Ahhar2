const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['thinkdifferent', 'admin', 'owner', 'kitchen', 'cashier', 'waiter', 'inventory_manager'], default: "admin" },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'standard', 'premium'], default: 'free' },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    validUntil: { type: Date },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
