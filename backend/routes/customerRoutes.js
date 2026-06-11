const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Session = require('../models/Session');
const Order = require('../models/Order');
const ServiceRequest = require('../models/ServiceRequest');
const socket = require('../socket');

// Get Table & Restaurant Info
router.get('/table/:tableId', async (req, res) => {
  try {
    const table = await Table.findById(req.params.tableId).populate('ownerId');
    if (!table) return res.status(404).json({ message: 'Table not found' });
    
    const restaurant = await Restaurant.findOne({ ownerId: table.ownerId._id });
    res.json({ table, restaurant });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Menu (Categories + Items) for a Restaurant
router.get('/menu/:ownerId', async (req, res) => {
  try {
    const categories = await Category.find({ ownerId: req.params.ownerId });
    const items = await MenuItem.find({ ownerId: req.params.ownerId });
    res.json({ categories, items });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active session for a table
router.get('/session/:tableId', async (req, res) => {
  try {
    const session = await Session.findOne({ tableId: req.params.tableId, status: 'active' });
    res.json(session || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new session
router.post('/session/create', async (req, res) => {
  try {
    const { tableId, restaurantId } = req.body;
    
    // Check if there is already an active session
    let session = await Session.findOne({ tableId, status: 'active' });
    if (session) {
      return res.json(session);
    }
    
    session = new Session({
      tableId,
      restaurantId,
      status: 'active',
      totalAmount: 0
    });
    await session.save();
    
    // Mark table as occupied
    await Table.findByIdAndUpdate(tableId, { status: 'occupied' });
    
    const io = socket.getIO();
    io.to(restaurantId.toString()).emit('table-occupied', { tableId });
    
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Place an order
router.post('/orders', async (req, res) => {
  try {
    const { sessionId, tableId, restaurantId, items, totalAmount } = req.body;
    
    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newOrder = new Order({
      sessionId,
      tableId,
      restaurantId,
      orderNumber,
      items,
      totalAmount,
      status: 'pending'
    });
    
    await newOrder.save();
    
    // Update session total
    await Session.findByIdAndUpdate(sessionId, { $inc: { totalAmount } });
    
    // Automatic Stock Deduction Logic
    const Recipe = require('../models/Recipe');
    const Ingredient = require('../models/Ingredient');
    const StockLog = require('../models/StockLog');
    
    for (const item of items) {
      const recipe = await Recipe.findOne({ menuItemId: item.menuItemId });
      if (recipe) {
        for (const recipeIng of recipe.ingredients) {
          const totalQtyToDeduct = recipeIng.quantity * item.quantity;
          const ingredient = await Ingredient.findById(recipeIng.ingredientId);
          
          if (ingredient) {
            const oldStock = ingredient.currentStock;
            const newStock = Math.max(0, ingredient.currentStock - totalQtyToDeduct);
            
            ingredient.currentStock = newStock;
            await ingredient.save();
            
            // Log consumption
            const log = new StockLog({
              restaurantId,
              ingredientId: ingredient._id,
              movementType: 'consumption',
              quantity: totalQtyToDeduct,
              previousStock: oldStock,
              newStock: newStock,
              referenceId: newOrder._id
            });
            await log.save();
            
            // Check for Out of Stock -> Auto-disable affected menu items
            if (newStock === 0 && oldStock > 0) {
              const MenuItem = require('../models/MenuItem');
              // Find all recipes that use this ingredient
              const affectedRecipes = await Recipe.find({ 'ingredients.ingredientId': ingredient._id });
              for (const r of affectedRecipes) {
                await MenuItem.findByIdAndUpdate(r.menuItemId, { isAvailable: false });
              }
            }
          }
        }
      }
    }
    
    // Populate table details before emitting
    await newOrder.populate('tableId', 'tableNumber');
    
    // Emit to kitchen
    const io = socket.getIO();
    // Use toString() to ensure string format
    io.to(restaurantId.toString()).emit('new-order', newOrder);
    
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get orders for a session
router.get('/orders/session/:sessionId', async (req, res) => {
  try {
    const orders = await Order.find({ sessionId: req.params.sessionId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a service request
router.post('/service-request', async (req, res) => {
  try {
    const { tableId, restaurantId, sessionId, requestType, customMessage } = req.body;
    const newRequest = new ServiceRequest({
      tableId,
      restaurantId,
      sessionId,
      requestType,
      customMessage,
      status: 'pending'
    });
    await newRequest.save();
    
    // Populate table details before emitting
    await newRequest.populate('tableId', 'tableNumber');
    
    // Emit to kitchen/admin
    const io = socket.getIO();
    io.to(restaurantId.toString()).emit('new-service-request', newRequest);
    
    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active service requests for session
router.get('/service-request/session/:sessionId', async (req, res) => {
  try {
    const ServiceRequest = require('../models/ServiceRequest');
    const requests = await ServiceRequest.find({
      sessionId: req.params.sessionId,
      status: { $ne: 'completed' }
    }).populate('assignedTo', 'name');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
