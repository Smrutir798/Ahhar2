const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ingredient = require('../models/Ingredient');
const StockLog = require('../models/StockLog');

// Get all ingredients
router.get('/', auth, async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ restaurantId: req.user.restaurantId }).populate('supplierId');
    res.json(ingredients);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add ingredient
router.post('/', auth, async (req, res) => {
  try {
    const ingredient = new Ingredient({ ...req.body, restaurantId: req.user.restaurantId });
    await ingredient.save();
    res.status(201).json(ingredient);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update ingredient & log manual stock adjustment
router.put('/:id', auth, async (req, res) => {
  try {
    const oldIngredient = await Ingredient.findById(req.params.id);
    const newIngredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('supplierId');
    
    // If stock changed manually (not via purchase/consumption API), log adjustment
    if (req.body.currentStock !== undefined && oldIngredient.currentStock !== req.body.currentStock) {
      const log = new StockLog({
        restaurantId: req.user.restaurantId,
        ingredientId: newIngredient._id,
        movementType: 'adjustment',
        quantity: req.body.currentStock - oldIngredient.currentStock,
        previousStock: oldIngredient.currentStock,
        newStock: req.body.currentStock,
      });
      await log.save();
    }
    
    res.json(newIngredient);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete ingredient
router.delete('/:id', auth, async (req, res) => {
  try {
    await Ingredient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
