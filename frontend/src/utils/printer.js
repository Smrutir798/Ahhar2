import ReceiptPrinterEncoder from 'thermal-printer-encoder';
import axios from '@/lib/axios';

// Get connected serial port (requires user to select it once)
let selectedPort = null;

export const connectUSBPrinter = async () => {
  if (!('serial' in navigator)) {
    throw new Error('Web Serial API not supported in this browser. Please use Chrome or Edge.');
  }
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    selectedPort = port;
    return true;
  } catch (err) {
    console.error('Error connecting to USB printer:', err);
    throw err;
  }
};

// Formats the bill and generates a raw ESC/POS byte array
export const formatReceipt = (bill, restaurantName = "Ahhar Restaurant") => {
  const encoder = new ReceiptPrinterEncoder({
    language: 'esc-pos',
    width: 32 // 58mm printer (use 48 for 80mm)
  });

  let receipt = encoder
    .initialize()
    .align('center')
    .bold(true)
    .size('double', 'double')
    .line(restaurantName)
    .bold(false)
    .size('normal', 'normal')
    .newline()
    .line(`Bill No: ${bill.billNumber || bill._id.slice(-6)}`)
    .line(`Table: ${bill.tableId?.tableNumber || 'N/A'}`)
    .line(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`)
    .newline()
    .align('left')
    .rule({ style: 'single' })
    .table(
      [
        { width: 16, align: 'left' },
        { width: 4, align: 'right' },
        { width: 12, align: 'right' }
      ],
      [
        ['Item', 'Qty', 'Price'],
        ['----', '---', '-----']
      ]
    );

  const items = Array.isArray(bill.items) ? bill.items : [];
  items.forEach(item => {
    const itemName = item.menuItem?.name || 'Unknown Item';
    const price = `Rs${(item.quantity * item.price).toFixed(2)}`;
    // Truncate long item names
    receipt.table(
      [
        { width: 16, align: 'left' },
        { width: 4, align: 'right' },
        { width: 12, align: 'right' }
      ],
      [
        [itemName.substring(0, 15), item.quantity.toString(), price]
      ]
    );
  });

  receipt = receipt
    .rule({ style: 'single' })
    .align('right')
    .line(`Subtotal: Rs${bill.subtotal?.toFixed(2)}`)
    .line(`Tax: Rs${bill.taxAmount?.toFixed(2)}`)
    .bold(true)
    .size('normal', 'double')
    .line(`TOTAL: Rs${bill.grandTotal?.toFixed(2)}`)
    .bold(false)
    .size('normal', 'normal')
    .newline()
    .align('center')
    .line('Thank you for dining with us!')
    .newline()
    .newline()
    .newline()
    .cut();

  return receipt.encode();
};

export const printToUSB = async (bill) => {
  if (!selectedPort) {
    throw new Error('No USB printer connected. Please connect a printer first.');
  }
  try {
    const data = formatReceipt(bill);
    const writer = selectedPort.writable.getWriter();
    await writer.write(data);
    writer.releaseLock();
    return true;
  } catch (err) {
    console.error('Failed to print to USB:', err);
    throw err;
  }
};

export const printToNetwork = async (bill) => {
  try {
    const token = localStorage.getItem('token');
    await axios.post('/printer/print', { bill }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return true;
  } catch (err) {
    console.error('Failed to print to network:', err);
    throw err;
  }
};
