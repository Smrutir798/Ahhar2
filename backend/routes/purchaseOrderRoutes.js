const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PurchaseOrder = require('../models/PurchaseOrder');
const Ingredient = require('../models/Ingredient');
const StockLog = require('../models/StockLog');

// Get POs
router.get('/', auth, async (req, res) => {
  try {
    const pos = await PurchaseOrder.find({ restaurantId: req.user.restaurantId })
      .populate('supplierId')
      .populate('items.ingredientId')
      .sort({ createdAt: -1 });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create PO
router.post('/', auth, async (req, res) => {
  try {
    const po = new PurchaseOrder({ ...req.body, restaurantId: req.user.restaurantId });
    await po.save();
    res.status(201).json(po);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Receive PO
router.put('/:id/receive', auth, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ message: 'PO not found' });
    if (po.status === 'received') return res.status(400).json({ message: 'Already received' });

    po.status = 'received';
    po.receivedAt = new Date();
    await po.save();

    // Update stock and log
    for (let item of po.items) {
      const ingredient = await Ingredient.findById(item.ingredientId);
      if (ingredient) {
        const oldStock = ingredient.currentStock;
        ingredient.currentStock += item.quantity;
        await ingredient.save();

        const log = new StockLog({
          restaurantId: po.restaurantId,
          ingredientId: ingredient._id,
          movementType: 'purchase',
          quantity: item.quantity,
          previousStock: oldStock,
          newStock: ingredient.currentStock,
          referenceId: po._id
        });
        await log.save();
      }
    }

    const updatedPo = await PurchaseOrder.findById(req.params.id).populate('supplierId').populate('items.ingredientId');
    res.json(updatedPo);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
