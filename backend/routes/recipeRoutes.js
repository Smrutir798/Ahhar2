const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Recipe = require('../models/Recipe');

// Get recipes
router.get('/', auth, async (req, res) => {
  try {
    const recipes = await Recipe.find({ restaurantId: req.user.restaurantId })
      .populate('menuItemId')
      .populate('ingredients.ingredientId');
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add or update recipe for a menu item
router.post('/', auth, async (req, res) => {
  try {
    const { menuItemId, ingredients } = req.body;
    let recipe = await Recipe.findOne({ menuItemId });
    
    if (recipe) {
      recipe.ingredients = ingredients;
      await recipe.save();
    } else {
      recipe = new Recipe({
        restaurantId: req.user.restaurantId,
        menuItemId,
        ingredients
      });
      await recipe.save();
    }
    
    // Populate to return full data
    await recipe.populate('menuItemId');
    await recipe.populate('ingredients.ingredientId');
    
    res.status(201).json(recipe);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
