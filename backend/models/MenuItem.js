const mongoose = require('mongoose');

const modifierOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 }
});

const modifierSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Size", "Toppings"
  type: { type: String, enum: ['single', 'multiple'], default: 'single' }, // single selection (radio) or multiple selections (checkbox)
  required: { type: Boolean, default: false },
  options: [modifierOptionSchema]
});

const menuItemSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String }, // URL or text for phase 1
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  available: { type: Boolean, default: true },
  modifiers: [modifierSchema]
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
