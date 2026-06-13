const express = require('express');
const router = express.Router();
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

// @route   POST /api/printer/print
// @desc    Print a receipt to a Network POS Printer
router.post('/print', async (req, res) => {
  try {
    const { bill } = req.body;
    const printerIP = process.env.PRINTER_IP;

    if (!printerIP) {
      return res.status(400).json({ message: 'Network printer IP not configured in .env (PRINTER_IP)' });
    }

    let printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${printerIP}`
    });

    let isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      return res.status(503).json({ message: `Printer at ${printerIP} is not reachable.` });
    }

    printer.alignCenter();
    printer.println("Ahhar Restaurant");
    printer.drawLine();
    printer.alignLeft();
    printer.println(`Bill No: ${bill.billNumber || bill._id.slice(-6)}`);
    printer.println(`Table: ${bill.tableId?.tableNumber || 'N/A'}`);
    printer.println(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
    printer.drawLine();

    // Table Header
    printer.leftRight("Item", "Qty   Price");
    printer.drawLine();

    bill.items.forEach(item => {
      const name = (item.menuItem?.name || 'Unknown').substring(0, 15);
      const qty = item.quantity.toString().padEnd(3, ' ');
      const price = `Rs${(item.quantity * item.price).toFixed(2)}`;
      printer.leftRight(name, `${qty}   ${price}`);
    });

    printer.drawLine();
    printer.alignRight();
    printer.println(`Subtotal: Rs${bill.subtotal?.toFixed(2)}`);
    printer.println(`Tax: Rs${bill.taxAmount?.toFixed(2)}`);
    printer.setTextDoubleHeight();
    printer.println(`TOTAL: Rs${bill.grandTotal?.toFixed(2)}`);
    printer.setTextNormal();
    
    printer.alignCenter();
    printer.newLine();
    printer.println("Thank you for dining with us!");
    printer.newLine();
    printer.newLine();
    printer.cut();
    printer.beep();

    await printer.execute();
    
    res.json({ message: 'Printed successfully to network printer' });
  } catch (error) {
    console.error('Error printing to network POS:', error);
    res.status(500).json({ message: 'Failed to print receipt' });
  }
});

module.exports = router;
