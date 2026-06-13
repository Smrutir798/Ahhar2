const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  totalAmount: { type: Number, default: 0 },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  startedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  cart: [{
    cartItemId: { type: String, required: true }, // For atomic operations
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // Base price
    quantity: { type: Number, required: true },
    instructions: { type: String },
    selectedModifiers: [{
      name: { type: String },
      option: { type: String },
      price: { type: Number, default: 0 }
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
