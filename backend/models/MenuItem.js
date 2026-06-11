const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String }, // URL or text for phase 1
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
