const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  ingredients: [
    {
      ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
      quantity: { type: Number, required: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);
