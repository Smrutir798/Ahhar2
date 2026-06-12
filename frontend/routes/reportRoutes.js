const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Bill = require('../models/Bill');
const Order = require('../models/Order');
const Inventory = require('../models/Ingredient');

// Export CSV Report
router.get('/csv', auth, async (req, res) => {
  try {
    const { type } = req.query; // 'revenue', 'orders', 'inventory'
    const restaurantId = req.user.restaurantId;
    let csvData = '';

    if (type === 'revenue') {
      const bills = await Bill.find({ restaurantId, paymentStatus: 'paid' }).sort({ paidAt: -1 });
      csvData += 'Bill ID,Table,Amount,Payment Method,Date\n';
      bills.forEach(b => {
        csvData += `${b._id},${b.tableId},${b.grandTotal},${b.paymentMethod},${new Date(b.paidAt).toISOString()}\n`;
      });
    } else if (type === 'orders') {
      const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
      csvData += 'Order ID,Status,Total Amount,Items Count,Date\n';
      orders.forEach(o => {
        csvData += `${o.orderNumber},${o.status},${o.totalAmount},${o.items.length},${new Date(o.createdAt).toISOString()}\n`;
      });
    } else if (type === 'inventory') {
      const inv = await Inventory.find({ restaurantId });
      csvData += 'Ingredient,Category,Current Stock,Min Stock,Unit\n';
      inv.forEach(i => {
        csvData += `${i.name},${i.category},${i.currentStock},${i.minimumStock},${i.unit}\n`;
      });
    } else {
      return res.status(400).json({ message: 'Invalid report type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
    res.status(200).send(csvData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
