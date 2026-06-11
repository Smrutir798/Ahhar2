const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  movementType: { type: String, enum: ['purchase', 'consumption', 'adjustment', 'wastage'], required: true },
  quantity: { type: Number, required: true }, // positive or negative depending on context, or just absolute magnitude
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // e.g., OrderId, PurchaseOrderId, WastageId
}, { timestamps: true });

module.exports = mongoose.model('StockLog', stockLogSchema);
