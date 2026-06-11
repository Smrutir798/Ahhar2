const Table = require('../models/Table');
const QRCode = require('qrcode');

exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find({ ownerId: req.user.id }).sort({ tableNumber: 1 });
    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status } = req.body;
    
    // Create new table first to get its ID
    const newTable = new Table({
      ownerId: req.user.id,
      tableNumber,
      capacity,
      status
    });
    await newTable.save();

    // Generate QR Code data URI
    // Use an absolute URL that points to the frontend menu page for this table
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const menuUrl = `${frontendUrl}/menu/table/${newTable._id}`;
    
    const qrCodeUrl = await QRCode.toDataURL(menuUrl);
    newTable.qrCodeUrl = qrCodeUrl;
    await newTable.save();

    res.status(201).json(newTable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status } = req.body;
    let table = await Table.findOne({ _id: req.params.id, ownerId: req.user.id });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    table.tableNumber = tableNumber !== undefined ? tableNumber : table.tableNumber;
    table.capacity = capacity !== undefined ? capacity : table.capacity;
    table.status = status !== undefined ? status : table.status;
    
    await table.save();
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
