const Table = require('../models/Table');
const QRCode = require('qrcode');

exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find({ ownerId: req.user.id }).populate('assignedWaiter', 'name email').sort({ tableNumber: 1 });
    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLiveTableStatus = async (req, res) => {
  try {
    const Session = require('../models/Session');
    const Order = require('../models/Order');
    
    const Restaurant = require('../models/Restaurant');
    
    // Resolve ownerId correctly based on whether it's an admin/owner or staff
    let ownerId = req.user.id;
    let restaurant = null;
    
    if (req.user.restaurantId) {
      restaurant = await Restaurant.findById(req.user.restaurantId).lean();
      if (restaurant) {
        ownerId = restaurant.ownerId;
      }
    } else {
      restaurant = await Restaurant.findOne({ ownerId: req.user.id }).lean();
    }
    
    const taxes = restaurant?.taxSettings || { cgst: 2.5, sgst: 2.5, serviceCharge: 0 };
    
    const tables = await Table.find({ ownerId }).populate('assignedWaiter', 'name email').lean().sort({ tableNumber: 1 });
    
    for (let table of tables) {
      // Check active sessions regardless of table status, just in case
      const session = await Session.findOne({ tableId: table._id, status: 'active' }).lean();
      if (session) {
        table.activeSession = session;
        const orders = await Order.find({ sessionId: session._id, status: { $ne: 'cancelled' } }).lean().sort({ createdAt: -1 });
        table.orders = orders;
        
        const subtotal = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const cgstAmount = (subtotal * taxes.cgst) / 100;
        const sgstAmount = (subtotal * taxes.sgst) / 100;
        const serviceChargeAmount = (subtotal * taxes.serviceCharge) / 100;
        const grandTotal = Math.round(subtotal + cgstAmount + sgstAmount + serviceChargeAmount);

        table.billPreview = {
          subtotal,
          cgst: cgstAmount,
          sgst: sgstAmount,
          serviceCharge: serviceChargeAmount,
          grandTotal
        };
      }
    }
    res.json(tables);
  } catch (error) {
    console.error('getLiveTableStatus error:', error);
    res.status(500).json({ message: 'Server error fetching live status' });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status, assignedWaiter } = req.body;
    
    // Check subscription plan limits (Basic plan allows max 3 tables/QRs)
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (user) {
      const activePlan = user.subscription?.plan || 'free';
      if (activePlan === 'basic') {
        const tableCount = await Table.countDocuments({ ownerId: req.user.id });
        if (tableCount >= 3) {
          return res.status(403).json({ message: 'Basic plan is limited to 3 QR codes/tables. Please upgrade your plan.' });
        }
      }
    }

    // Create new table first to get its ID
    const newTable = new Table({
      ownerId: req.user.id,
      tableNumber,
      capacity,
      status,
      assignedWaiter: assignedWaiter || null
    });
    await newTable.save();

    // Generate QR Code data URI
    // Use an absolute URL that points to the frontend menu page for this table
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const menuUrl = `${frontendUrl}/menu/table/${newTable._id}`;
    
    const qrCodeUrl = await QRCode.toDataURL(menuUrl);
    newTable.qrCodeUrl = qrCodeUrl;
    await newTable.save();
    
    await newTable.populate('assignedWaiter', 'name email');

    res.status(201).json(newTable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status, assignedWaiter } = req.body;
    let table = await Table.findOne({ _id: req.params.id, ownerId: req.user.id });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    table.tableNumber = tableNumber !== undefined ? tableNumber : table.tableNumber;
    table.capacity = capacity !== undefined ? capacity : table.capacity;
    table.status = status !== undefined ? status : table.status;
    table.assignedWaiter = assignedWaiter !== undefined ? (assignedWaiter || null) : table.assignedWaiter;
    
    await table.save();
    await table.populate('assignedWaiter', 'name email');
    res.json(table);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const table = await Table.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
