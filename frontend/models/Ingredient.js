const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  currentStock: { type: Number, default: 0 },
  unit: { type: String, required: true }, // e.g., Kg, Gram, Liter, Ml, Piece, Pack
  minimumStock: { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
}, { timestamps: true });

module.exports = mongoose.model('Ingredient', ingredientSchema);
