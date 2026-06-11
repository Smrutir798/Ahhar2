const mongoose = require('mongoose');

const wastageSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Wastage', wastageSchema);
