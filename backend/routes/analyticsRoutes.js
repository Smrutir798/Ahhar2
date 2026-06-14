const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireFeature = require('../middleware/requireFeature');
const mongoose = require('mongoose');

const requirePremium = requireFeature(['premium']);

const Bill = require('../models/Bill');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Session = require('../models/Session');
const Feedback = require('../models/Feedback');
const ServiceRequest = require('../models/ServiceRequest');
const StockLog = require('../models/StockLog');
const Ingredient = require('../models/Ingredient');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');

// Executive Dashboard (Available on all plans)
router.get('/executive', auth, async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Today's Revenue
    const todayBills = await Bill.find({ restaurantId, paymentStatus: 'paid', paidAt: { $gte: startOfToday } });
    const todaysRevenue = todayBills.reduce((sum, bill) => sum + bill.grandTotal, 0);

    // Monthly Revenue
    const monthBills = await Bill.find({ restaurantId, paymentStatus: 'paid', paidAt: { $gte: startOfMonth } });
    const monthlyRevenue = monthBills.reduce((sum, bill) => sum + bill.grandTotal, 0);

    // Total Orders Today
    const todayOrders = await Order.countDocuments({ restaurantId, createdAt: { $gte: startOfToday } });

    // Avg Order Value Today
    const avgOrderValue = todayBills.length > 0 ? (todaysRevenue / todayBills.length) : 0;

    // Active Tables
    const activeTables = await Session.countDocuments({ restaurantId, status: 'active' });

    // Customer Satisfaction
    const feedbacks = await Feedback.find({ restaurantId });
    let rating = 5.0;
    if (feedbacks.length > 0) {
      const sum = feedbacks.reduce((acc, f) => acc + f.foodRating + f.serviceRating + f.cleanlinessRating, 0);
      rating = (sum / (feedbacks.length * 3)).toFixed(1);
    }

    res.json({
      todaysRevenue,
      monthlyRevenue,
      todayOrders,
      avgOrderValue: Math.round(avgOrderValue),
      activeTables,
      rating
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Service Analytics (for Customer Feedback BI)
router.get('/services/:restaurantId', auth, requirePremium, async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.params.restaurantId);
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const totalRequests = await ServiceRequest.countDocuments({ restaurantId, createdAt: { $gte: startOfToday } });
    const completedRequests = await ServiceRequest.countDocuments({ restaurantId, status: 'completed', createdAt: { $gte: startOfToday } });
    
    // Avg Response Time
    const requests = await ServiceRequest.find({ restaurantId, completedAt: { $exists: true } });
    let totalWaitTime = 0;
    requests.forEach(r => totalWaitTime += (new Date(r.completedAt) - new Date(r.createdAt)));
    const avgResponseTime = requests.length > 0 ? Math.round(totalWaitTime / requests.length / 60000) : 0;

    // Customer Satisfaction
    const feedbacks = await Feedback.find({ restaurantId });
    let customerSatisfaction = 0;
    if (feedbacks.length > 0) {
      const sum = feedbacks.reduce((acc, f) => acc + f.foodRating + f.serviceRating + f.cleanlinessRating, 0);
      customerSatisfaction = (sum / (feedbacks.length * 3)).toFixed(1);
    }

    res.json({
      totalRequests,
      completedRequests,
      avgResponseTime,
      customerSatisfaction
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Revenue Analytics
router.get('/revenue', auth, requirePremium, async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);
    
    // Revenue Trend (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0,0,0,0);

    const trend = await Bill.aggregate([
      { $match: { restaurantId, paymentStatus: 'paid', paidAt: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
          revenue: { $sum: "$grandTotal" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Revenue By Payment Method
    const byMethod = await Bill.aggregate([
      { $match: { restaurantId, paymentStatus: 'paid' } },
      { $group: { _id: "$paymentMethod", revenue: { $sum: "$grandTotal" } } }
    ]);

    res.json({ trend, byMethod });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Menu Analytics (Best Sellers)
router.get('/menu', auth, requirePremium, async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);

    const bestSellers = await Order.aggregate([
      { $match: { restaurantId, status: { $ne: 'cancelled' } } },
      { $unwind: "$items" },
      { $group: {
          _id: "$items.name",
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 }
    ]);

    res.json(bestSellers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Peak Hours
router.get('/peak-hours', auth, requirePremium, async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);
    const peakHours = await Order.aggregate([
      { $match: { restaurantId } },
      { $group: {
          _id: { $hour: "$createdAt" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { orderCount: -1 } }
    ]);
    res.json(peakHours);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Staff Performance
router.get('/staff', auth, requirePremium, async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);
    
    // Prep time = readyAt - preparingAt
    const orders = await Order.find({ restaurantId, readyAt: { $exists: true }, preparingAt: { $exists: true } });
    let totalPrepTime = 0;
    orders.forEach(o => totalPrepTime += (new Date(o.readyAt) - new Date(o.preparingAt)));
    const avgPrepTimeMins = orders.length > 0 ? Math.round(totalPrepTime / orders.length / 60000) : 0;

    // Waiter response time = completedAt - createdAt
    const requests = await ServiceRequest.find({ restaurantId, completedAt: { $exists: true } });
    let totalWaitTime = 0;
    requests.forEach(r => totalWaitTime += (new Date(r.completedAt) - new Date(r.createdAt)));
    const avgWaitTimeMins = requests.length > 0 ? Math.round(totalWaitTime / requests.length / 60000) : 0;

    // Fetch individual waiter performance
    const User = require('../models/User');
    const waiters = await User.find({ restaurantId, role: 'waiter' }).select('name email phone');
    const waiterStats = [];

    for (const waiter of waiters) {
      // Tables assigned to this waiter
      const assignedTables = await Table.find({ assignedWaiter: waiter._id }).select('tableNumber');
      
      // Requests resolved / active for this waiter
      const completedReqs = await ServiceRequest.find({ restaurantId, assignedTo: waiter._id, status: 'completed' });
      const activeReqsCount = await ServiceRequest.countDocuments({ restaurantId, assignedTo: waiter._id, status: 'accepted' });

      let totalFulfillTime = 0;
      completedReqs.forEach(r => {
        if (r.completedAt) {
          totalFulfillTime += (new Date(r.completedAt) - new Date(r.createdAt));
        }
      });
      const avgFulfillTimeMins = completedReqs.length > 0 ? Math.round(totalFulfillTime / completedReqs.length / 60000) : 0;

      waiterStats.push({
        _id: waiter._id,
        name: waiter.name,
        email: waiter.email,
        phone: waiter.phone,
        assignedTables: assignedTables.map(t => t.tableNumber).sort((a,b)=>a-b),
        requestsCompleted: completedReqs.length,
        activeRequestsCount: activeReqsCount,
        avgFulfillTimeMins
      });
    }

    // Fetch recent/live service requests for task monitoring
    const recentRequests = await ServiceRequest.find({ restaurantId })
      .populate('tableId', 'tableNumber')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(15);

    res.json({ 
      avgPrepTimeMins, 
      avgWaitTimeMins, 
      ordersPrepared: orders.length, 
      requestsCompleted: requests.length,
      waiters: waiterStats,
      recentRequests
    });
  } catch (err) {
    console.error('Staff performance fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Inventory Consumption
router.get('/inventory', auth, requirePremium, async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);
    
    const consumed = await StockLog.aggregate([
      { $match: { restaurantId, movementType: 'consumption' } },
      { $group: {
          _id: "$ingredientId",
          totalConsumed: { $sum: "$quantity" }
        }
      },
      { $lookup: { from: "ingredients", localField: "_id", foreignField: "_id", as: "ingredient" } },
      { $unwind: "$ingredient" },
      { $project: { name: "$ingredient.name", unit: "$ingredient.unit", totalConsumed: 1 } },
      { $sort: { totalConsumed: -1 } },
      { $limit: 10 }
    ]);

    res.json(consumed);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// AI Insights Heuristics
router.get('/insights', auth, requirePremium, async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const insights = [];

    // Check low stock
    const lowStockCount = await Ingredient.countDocuments({ restaurantId, $expr: { $lte: ["$currentStock", "$minimumStock"] } });
    if (lowStockCount > 0) insights.push({ type: 'warning', text: `${lowStockCount} ingredients are low on stock. Create a Purchase Order soon.` });

    // Check best seller
    const bestSellers = await Order.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
      { $unwind: "$items" },
      { $group: { _id: "$items.name", qty: { $sum: "$items.quantity" } } },
      { $sort: { qty: -1 } },
      { $limit: 1 }
    ]);
    if (bestSellers.length > 0) insights.push({ type: 'success', text: `Your best seller is ${bestSellers[0]._id}! Consider promoting it further.` });

    // Peak hours
    const peakHours = await Order.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
      { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    if (peakHours.length > 0) insights.push({ type: 'info', text: `Your peak order hour is around ${peakHours[0]._id}:00. Ensure adequate staffing.` });

    if (insights.length === 0) insights.push({ type: 'info', text: 'Gathering more data to generate insights...' });

    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Profit Analytics
router.get('/profit', auth, requirePremium, async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);
    
    // Revenue
    const bills = await Bill.aggregate([
      { $match: { restaurantId, paymentStatus: 'paid' } },
      { $group: { _id: null, revenue: { $sum: "$grandTotal" } } }
    ]);
    const totalRevenue = bills.length > 0 ? bills[0].revenue : 0;

    // Cost (from StockLog where movementType is consumption or wastage)
    const costs = await StockLog.aggregate([
      { $match: { restaurantId, movementType: { $in: ['consumption', 'wastage'] } } },
      { $lookup: { from: "ingredients", localField: "ingredientId", foreignField: "_id", as: "ing" } },
      { $unwind: "$ing" },
      { $group: { _id: null, totalCost: { $sum: { $multiply: ["$quantity", "$ing.purchasePrice"] } } } }
    ]);
    const totalCost = costs.length > 0 ? costs[0].totalCost : 0;

    res.json({
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalRevenue - totalCost
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Customer Analytics
router.get('/customers', auth, requirePremium, async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);
    
    // We don't have a distinct Customer collection, but we have Session which has customer phone numbers or identifiers if implemented.
    // For now, we can aggregate Sessions to find repeat phone numbers if they exist, or just return total sessions.
    
    const totalSessions = await Session.countDocuments({ restaurantId });
    const bills = await Bill.find({ restaurantId, paymentStatus: 'paid' });
    const avgSpend = bills.length > 0 ? bills.reduce((acc, b) => acc + b.grandTotal, 0) / bills.length : 0;

    res.json({
      totalCustomers: totalSessions,
      newCustomers: Math.round(totalSessions * 0.8), // Placeholder logic for demonstration
      repeatCustomers: Math.round(totalSessions * 0.2), // Placeholder logic
      averageSpend: avgSpend
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Order Analytics
router.get('/orders', auth, requirePremium, async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);
    
    const totalOrders = await Order.countDocuments({ restaurantId });
    const completedOrders = await Order.countDocuments({ restaurantId, status: 'served' });
    const cancelledOrders = await Order.countDocuments({ restaurantId, status: 'cancelled' });
    const pendingOrders = await Order.countDocuments({ restaurantId, status: { $in: ['pending', 'preparing', 'ready'] } });

    res.json({
      totalOrders,
      completedOrders,
      cancelledOrders,
      pendingOrders
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
