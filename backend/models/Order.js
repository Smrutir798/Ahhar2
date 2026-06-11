const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  instructions: { type: String }
});

const orderSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  orderNumber: { type: String, required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'preparing', 'ready', 'served'], default: 'pending' },
  preparingAt: { type: Date },
  readyAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
