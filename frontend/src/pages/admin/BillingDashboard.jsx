import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import { connectUSBPrinter, printToUSB, printToNetwork } from '../../utils/printer';
import { Printer, Banknote, QrCode, CreditCard, CheckCircle, FileDown, Search, FileText, ChevronDown } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Existing imports remain unchanged

// Updated handlePrint to auto-connect USB printer if not connected
const handlePrint = async (bill, type) => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`/customer/orders/session/${bill.sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orders = res.data;
    const allItems = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        allItems.push({
          menuItem: { name: item.name },
          quantity: item.quantity,
          price: item.price
        });
      });
    });
    const printBill = { ...bill, items: allItems };

    if (type === 'usb') {
      try {
        await printToUSB(printBill);
      } catch (err) {
        if (err.message && err.message.includes('No USB printer connected')) {
          await connectUSBPrinter();
          await printToUSB(printBill);
        } else {
          throw err;
        }
      }
    } else {
      await printToNetwork(printBill);
    }
  } catch (err) {
    alert(err.message || 'Failed to print');
  }
};

// New function to export bill as PDF using jspdf
const handleExportPdf = async (bill) => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`/customer/orders/session/${bill.sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orders = res.data;
    const allItems = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        allItems.push({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        });
      });
    });

    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Bill #${bill.billNumber || bill._id.slice(-6)}`, 14, 20);
    doc.text(`Table: ${bill.tableId?.tableNumber || 'N/A'}`, 14, 28);
    doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 36);

    const headers = [['Item', 'Qty', 'Price']];
    const rows = allItems.map(item => [
      item.name.substring(0, 20) || 'Unknown',
      item.quantity.toString(),
      `Rs. ${(item.quantity * item.price).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 45,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      styles: { fontSize: 10 }
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Subtotal: Rs. ${bill.subtotal?.toFixed(2)}`, 14, finalY);
    doc.text(`CGST: Rs. ${bill.cgst?.toFixed(2) || '0.00'}`, 14, finalY + 6);
    doc.text(`SGST: Rs. ${bill.sgst?.toFixed(2) || '0.00'}`, 14, finalY + 12);
    let totalY = finalY + 18;
    if (bill.serviceCharge > 0) {
      doc.text(`Service Charge: Rs. ${bill.serviceCharge?.toFixed(2)}`, 14, totalY);
      totalY += 6;
    }
    doc.text(`TOTAL: Rs. ${bill.grandTotal?.toFixed(2)}`, 14, totalY);

    doc.save(`Bill_${bill.billNumber || bill._id.slice(-6)}.pdf`);
  } catch (err) {
    console.error('Failed to generate PDF', err);
    alert('Failed to generate PDF. Could not fetch items.');
  }
};


const BillingDashboard = () => {
  const { user } = useContext(AuthContext);
  const [bills, setBills] = useState([]);
  const [activeTables, setActiveTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'pending' | 'completed'

  const [searchQuery, setSearchQuery] = useState('');
  const [amountFilter, setAmountFilter] = useState('all'); // 'all' | 'under200' | '200to500' | 'over500'
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'cash' | 'upi' | 'card'

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/bills/${user.restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBills(res.data);
    } catch (err) {
      console.error('Failed to fetch bills', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/tables/live-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveTables(res.data.filter(t => t.activeSession));
    } catch (err) {
      console.error('Failed to fetch active tables', err);
    }
  };

  useEffect(() => {
    if (user?.restaurantId) {
      fetchBills();
      fetchActiveTables();
    }
  }, [user]);

  // Listen for new bills and paid bills
  useSocket({ type: 'restaurant', id: user?.restaurantId || user?._id || user?.id }, {
    'new-bill': (newBill) => {
      setBills(prev => [newBill, ...prev]);
      fetchActiveTables();
    },
    'bill-paid': (paidBill) => {
      setBills(prev => prev.map(b => b._id === paidBill._id ? paidBill : b));
      fetchActiveTables();
    },
    'new-order': () => fetchActiveTables(),
    'table-occupied': () => fetchActiveTables()
  });

  const markAsPaid = async (billId, paymentMethod) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/bills/${billId}/pay`, 
        { paymentMethod }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setBills(prev => prev.map(b => b._id === billId ? res.data : b));
    } catch (err) {
      console.error('Failed to mark as paid', err);
      alert('Error processing payment');
    }
  };

  const handleGenerateBill = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/bills/generate/${sessionId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // The socket event will trigger fetchActiveTables and setBills, but we can do it optimistically or just wait.
      // We will also manually switch tab.
      setActiveTab('pending');
    } catch (err) {
      console.error(err);
      alert('Failed to generate bill');
    }
  };

  // Reset payment filter if we switch to pending tab
  useEffect(() => {
    if (activeTab === 'pending') {
      setPaymentFilter('all');
    }
  }, [activeTab]);

  const pendingBills = bills.filter(b => b.paymentStatus === 'pending');
  const completedBills = bills.filter(b => b.paymentStatus === 'paid');

  // Filter bills based on search, amount range, and payment method
  const filteredBills = bills.filter(b => {
    // 1. Tab status filter
    const requiredStatus = activeTab === 'pending' ? 'pending' : 'paid';
    if (b.paymentStatus !== requiredStatus) return false;

    // 2. Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const tableNum = String(b.tableId?.tableNumber || '').toLowerCase();
      const billNum = String(b.billNumber || '').toLowerCase();
      if (!tableNum.includes(q) && !billNum.includes(q)) return false;
    }

    // 3. Amount filter
    if (amountFilter !== 'all') {
      const total = b.grandTotal;
      if (amountFilter === 'under200' && total >= 200) return false;
      if (amountFilter === '200to500' && (total < 200 || total > 500)) return false;
      if (amountFilter === 'over500' && total <= 500) return false;
    }

    // 4. Payment filter (only for paid/completed bills)
    if (activeTab === 'completed' && paymentFilter !== 'all') {
      if (b.paymentMethod !== paymentFilter) return false;
    }

    return true;
  });

  if (loading) {
    return <div className="p-16 text-center text-muted-foreground font-sans">Loading Billing System...</div>;
  }

  return (
    <div className="flex flex-col h-full font-sans">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Billing POS</h1>
          <p className="text-muted-foreground text-sm font-sans">Manage active sessions and process payments</p>
        </div>
        
        <div className="glass p-1 rounded-xl flex border border-border/10 shadow-sm w-fit">
          <button 
            className={`px-4 py-2 rounded-lg font-bold font-sans text-sm transition-all duration-300 ${activeTab === 'active' ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('active')}
          >
            Active Tables ({activeTables.length})
          </button>
          <button 
            className={`px-4 py-2 rounded-lg font-bold font-sans text-sm transition-all duration-300 ${activeTab === 'pending' ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Payments ({pendingBills.length})
          </button>
          <button 
            className={`px-4 py-2 rounded-lg font-bold font-sans text-sm transition-all duration-300 ${activeTab === 'completed' ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed Bills ({completedBills.length})
          </button>
        </div>
      </div>

      {/* Filtration System Panel */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-start lg:items-center justify-between glass border border-border/15 p-4 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Input 
            placeholder="Search by table or bill #..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 glass-input"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Amount range selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Amount:</span>
            {[
              { label: 'All', value: 'all' },
              { label: '< ₹200', value: 'under200' },
              { label: '₹200 - ₹500', value: '200to500' },
              { label: '> ₹500', value: 'over500' }
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setAmountFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                  amountFilter === f.value
                    ? 'bg-foreground text-background border-transparent shadow-sm font-bold'
                    : 'glass border-border/20 text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Payment Method filter */}
          {activeTab === 'completed' && (
            <div className="flex flex-wrap items-center gap-2 border-l border-border/10 pl-0 lg:pl-4">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Payment:</span>
              {[
                { label: 'All', value: 'all' },
                { label: 'Cash', value: 'cash' },
                { label: 'UPI', value: 'upi' },
                { label: 'Card', value: 'card' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setPaymentFilter(f.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                    paymentFilter === f.value
                      ? 'bg-foreground text-background border-transparent shadow-sm font-bold'
                      : 'glass border-border/20 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid of Bills */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'active' ? (
          activeTables.length === 0 ? (
            <div className="col-span-full py-16 text-center glass border border-dashed border-border/20 rounded-2xl">
              <FileText size={48} className="mx-auto text-muted-foreground/40 mb-4 animate-pulse" />
              <h3 className="text-lg font-bold font-heading text-foreground">No Active Tables</h3>
              <p className="text-sm text-muted-foreground mt-1">No tables are currently occupied.</p>
            </div>
          ) : (
            activeTables.map(table => (
              <Card key={table._id} className="overflow-hidden flex flex-col hover:border-foreground/30 hover:shadow-md transition-all duration-300">
                <div className="p-4 border-b border-border/10 bg-foreground/5 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold font-heading text-foreground text-lg">Table {table.tableNumber}</h3>
                    <p className="text-xs text-muted-foreground font-mono">Customer: {table.activeSession?.customerName || 'Guest'}</p>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/25">
                    OCCUPIED
                  </div>
                </div>
                
                <div className="p-4 flex-1 text-sm font-sans space-y-3 overflow-y-auto max-h-[300px]">
                  {table.orders?.length > 0 ? table.orders.map(order => (
                    <details key={order._id} className="bg-foreground/5 rounded-lg border border-border/10 group">
                      <summary className="flex justify-between items-center p-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">Order #{order.orderNumber}</span>
                          <ChevronDown size={14} className="text-muted-foreground transition-transform group-open:rotate-180" />
                        </div>
                        <span className="text-[10px] font-bold bg-background text-muted-foreground px-2 py-0.5 rounded shadow-sm border border-border/20">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </summary>
                      <div className="p-3 pt-0 border-t border-border/10 mt-1 space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                            <span className="text-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )) : (
                    <div className="text-center text-muted-foreground text-xs py-4">No orders placed yet.</div>
                  )}
                </div>
                
                <div className="p-4 border-t border-border/10 bg-foreground/5 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{table.billPreview?.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground/80">
                    <span>CGST</span>
                    <span>₹{table.billPreview?.cgst?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground/80">
                    <span>SGST</span>
                    <span>₹{table.billPreview?.sgst?.toFixed(2) || '0.00'}</span>
                  </div>
                  {table.billPreview?.serviceCharge > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground/80">
                      <span>Service Charge</span>
                      <span>₹{table.billPreview?.serviceCharge?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-3 pt-2 border-t border-border/10">
                    <span className="font-bold font-heading text-foreground">Grand Total</span>
                    <span className="font-bold font-heading text-xl text-foreground">₹{table.billPreview?.grandTotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <Button 
                    className="w-full font-bold font-heading shadow-md" 
                    onClick={() => handleGenerateBill(table.activeSession._id)}
                    disabled={!table.orders || table.orders.length === 0}
                  >
                    Generate Bill
                  </Button>
                </div>
              </Card>
            ))
          )
        ) : filteredBills.length === 0 ? (
          <div className="col-span-full py-16 text-center glass border border-dashed border-border/20 rounded-2xl">
            <FileText size={48} className="mx-auto text-muted-foreground/40 mb-4 animate-pulse" />
            <h3 className="text-lg font-bold font-heading text-foreground">No matches found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query or filtration settings</p>
          </div>
        ) : (
          filteredBills.map(bill => (
            <Card key={bill._id} className="overflow-hidden flex flex-col hover:border-foreground/30 hover:shadow-md transition-all duration-300">
              <div className="p-4 border-b border-border/10 bg-foreground/5 flex justify-between items-start">
                <div>
                  <h3 className="font-bold font-heading text-foreground text-lg">Table {bill.tableId?.tableNumber || '?'}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{bill.billNumber}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  bill.paymentStatus === 'paid' 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25' 
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/25'
                }`}>
                  {bill.paymentStatus?.toUpperCase()}
                </div>
              </div>
              
              <div className="p-4 flex-1 text-sm font-sans space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{bill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground/85">
                  <span>CGST</span>
                  <span>₹{bill.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground/85">
                  <span>SGST</span>
                  <span>₹{bill.sgst.toFixed(2)}</span>
                </div>
                {bill.serviceCharge > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground/85">
                    <span>Service Charge</span>
                    <span>₹{bill.serviceCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-border/10 pt-3 mt-1 flex justify-between items-center">
                  <span className="font-bold font-heading text-foreground">Grand Total</span>
                  <span className="font-bold font-heading text-xl text-foreground">₹{bill.grandTotal}</span>
                </div>
              </div>
              
              <div className="p-4 border-t border-border/10 bg-foreground/5">
                {bill.paymentStatus === 'pending' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Process Payment</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handlePrint(bill, 'usb')} title="Print via USB" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                          <Printer size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleExportPdf(bill)} title="Export PDF" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                          <FileDown size={12} />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => markAsPaid(bill._id, 'cash')}
                        className="flex flex-col h-auto items-center justify-center p-2 rounded-xl border border-border/20 hover:bg-foreground/5 transition-all duration-300"
                      >
                        <Banknote size={16} className="mb-1 text-foreground" />
                        <span className="text-[10px] font-bold">Cash</span>
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => markAsPaid(bill._id, 'upi')}
                        className="flex flex-col h-auto items-center justify-center p-2 rounded-xl border border-border/20 hover:bg-foreground/5 transition-all duration-300"
                      >
                        <QrCode size={16} className="mb-1 text-foreground" />
                        <span className="text-[10px] font-bold">UPI</span>
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => markAsPaid(bill._id, 'card')}
                        className="flex flex-col h-auto items-center justify-center p-2 rounded-xl border border-border/20 hover:bg-foreground/5 transition-all duration-300"
                      >
                        <CreditCard size={16} className="mb-1 text-foreground" />
                        <span className="text-[10px] font-bold">Card</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-sm font-sans">
                    <div className="flex items-center text-emerald-500 font-bold">
                      <CheckCircle size={16} className="mr-1.5" /> Paid via {bill.paymentMethod?.toUpperCase()}
                    </div>
                    <div className="flex gap-1 relative">
                      <Button variant="ghost" size="icon" onClick={() => handlePrint(bill, 'usb')} title="Print USB" className="h-8 w-8 hover:bg-foreground/10 text-muted-foreground hover:text-foreground flex flex-col items-center relative group">
                        <Printer size={16} />
                        <span className="text-[8px] absolute -bottom-1 opacity-0 group-hover:opacity-100">USB</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePrint(bill, 'network')} title="Print Network" className="h-8 w-8 hover:bg-foreground/10 text-muted-foreground hover:text-foreground flex flex-col items-center relative group">
                        <Printer size={16} />
                        <span className="text-[8px] absolute -bottom-1 opacity-0 group-hover:opacity-100">NET</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleExportPdf(bill)} title="Export PDF" className="h-8 w-8 hover:bg-foreground/10 text-muted-foreground hover:text-foreground flex flex-col items-center relative group">
                        <FileDown size={16} />
                        <span className="text-[8px] absolute -bottom-1 opacity-0 group-hover:opacity-100">PDF</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BillingDashboard;
