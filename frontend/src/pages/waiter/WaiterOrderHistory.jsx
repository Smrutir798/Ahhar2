import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '@/lib/axios';
import { CartContext } from '../../context/CartContext';
import useSocket from '../../hooks/useSocket';
import { ArrowLeft, CheckCircle, Utensils, Receipt, Download, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const WaiterOrderHistory = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { session, setSession } = useContext(CartContext);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  // Listen to live socket events for this session
  useSocket({ type: 'session', id: session?._id }, {
    'order-status-changed': (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    },
    'bill-paid': () => {
      setGeneratedBill(null);
      setSession(null);
      navigate('/waiter/order');
    }
  });

  useEffect(() => {
    const fetchOrders = async () => {
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        const ordersRes = await axios.get(`/customer/orders/session/${session._id}`);
        setOrders(ordersRes.data);
        
        // Check if bill already generated
        try {
          const billRes = await axios.get(`/bills/session/${session._id}`);
          if (billRes.data) {
            setGeneratedBill(billRes.data);
          }
        } catch(e) {
          // Bill might not exist yet, ignore 404
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const handleGenerateBill = async () => {
    setIsGenerating(true);
    try {
      const res = await axios.post(`/bills/generate/${session._id}`);
      setGeneratedBill(res.data);
    } catch (err) {
      alert("Failed to generate bill.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkAsPaid = async (paymentMethod = 'cash') => {
    if (!generatedBill || !window.confirm(`Mark bill as paid via ${paymentMethod.toUpperCase()}?`)) return;
    
    setIsMarkingPaid(true);
    try {
      await axios.put(`/bills/${generatedBill._id}/pay`, { paymentMethod });
      // Socket event 'bill-paid' will handle the redirect, but as a fallback:
      setTimeout(() => {
        setSession(null);
        navigate('/waiter/order');
      }, 1000);
    } catch (err) {
      alert('Failed to mark bill as paid');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const downloadPDF = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Invoice', 14, 22);
        
        doc.setFontSize(11);
        doc.text(`Bill No: ${generatedBill.billNumber}`, 14, 32);
        doc.text(`Date: ${new Date(generatedBill.generatedAt).toLocaleString()}`, 14, 38);
        doc.text(`Table No: ${generatedBill.tableId?.tableNumber || '?'}`, 14, 44);
        
        const tableColumn = ["Item", "Qty", "Total (Rs.)"];
        const tableRows = [];
        
        orders.forEach(order => {
          order.items.forEach(item => {
            let itemName = item.name;
            if (item.selectedModifiers && item.selectedModifiers.length > 0) {
              const mods = item.selectedModifiers.map(m => `${m.name}: ${m.option}`).join(', ');
              itemName += ` (${mods})`;
            }
            tableRows.push([itemName, item.quantity, item.price * item.quantity]);
          });
        });
        
        autoTable(doc, { startY: 50, head: [tableColumn], body: tableRows });
        const finalY = doc.lastAutoTable.finalY || 50;
        
        doc.text(`Subtotal: Rs. ${generatedBill.subtotal}`, 14, finalY + 10);
        doc.text(`CGST: Rs. ${generatedBill.cgst}`, 14, finalY + 16);
        doc.text(`SGST: Rs. ${generatedBill.sgst}`, 14, finalY + 22);
        if (generatedBill.serviceCharge > 0) doc.text(`Service Charge: Rs. ${generatedBill.serviceCharge}`, 14, finalY + 28);
        
        doc.setFontSize(14);
        doc.text(`Grand Total: Rs. ${generatedBill.grandTotal}`, 14, finalY + 40);
        
        doc.save(`${generatedBill.billNumber}.pdf`);
      });
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-primary/10 text-primary border-primary/20';
      case 'preparing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ready': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'served': return 'bg-gray-100 text-gray-500 border-gray-200 opacity-70';
      default: return 'bg-foreground/5 text-foreground border-border';
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-foreground font-heading">Loading Orders...</div>;

  return (
    <div className="flex flex-col flex-1 bg-transparent pb-32 relative min-h-screen text-foreground transition-colors duration-300">
      {/* Header */}
      <div className="bg-card/40 backdrop-blur-xl border-b border-border/40 px-4 py-4 sticky top-0 z-10 shadow-lg flex items-center gap-4">
        <button onClick={() => navigate(`/waiter/order/${tableId}`)} className="p-2 -ml-2 rounded-full hover:bg-foreground/5 text-foreground">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-heading">Table Orders</h1>
          <p className="text-xs font-bold text-primary">Session: {session?.customerName || 'Walk-in'}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Orders List */}
        <div>
          {orders.length === 0 ? (
            <div className="bg-card/30 rounded-2xl p-8 text-center shadow-sm border border-border">
              <Utensils size={48} className="mx-auto text-muted-foreground/60 mb-4" />
              <h2 className="text-lg font-bold text-foreground mb-2 font-heading">No orders placed yet</h2>
              <div className="flex flex-col gap-3 max-w-xs mx-auto mt-4">
                <Button onClick={() => navigate(`/waiter/order/${tableId}`)} className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">Return to Menu</Button>
                {session && (
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to cancel this empty session and free the table?")) {
                        try {
                          await axios.delete(`/customer/session/${session._id}`);
                          setSession(null);
                          navigate('/waiter/order');
                        } catch(err) {
                          console.error(err);
                        }
                      }
                    }}
                    className="rounded-full text-destructive border-destructive hover:bg-destructive/10 bg-transparent"
                  >
                    Cancel Table Session
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-card/30 rounded-2xl p-5 shadow-sm border border-border hover:border-primary/20 transition-all duration-300">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/40">
                    <h3 className="font-bold text-foreground font-heading">{order.orderNumber}</h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </div>
                  </div>
                  <div className="space-y-3 mb-4 font-sans">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col text-sm border-b border-border/10 pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">{item.quantity} x {item.name}</span>
                          <span className="text-foreground font-bold">₹{item.price * item.quantity}</span>
                        </div>
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <div className="text-[11px] text-muted-foreground ml-6">
                            + {item.selectedModifiers.map(m => `${m.name}: ${m.option}`).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-dashed border-border/60">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-bold text-lg text-foreground font-heading">₹{order.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Bill Generation */}
      {orders.length > 0 && !generatedBill && (
        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-20 pointer-events-none">
          <button 
            className="w-full max-w-sm bg-primary text-primary-foreground rounded-full p-4 font-bold flex justify-center items-center shadow-xl pointer-events-auto border border-border hover:scale-[1.02] active:scale-95 transition-all duration-300 gap-2"
            onClick={handleGenerateBill}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating Bill...' : <><Receipt size={20} /> Generate & Pay Bill</>}
          </button>
        </div>
      )}

      {/* Bill Preview Modal Overlay */}
      {generatedBill && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full sm:max-w-md h-[85vh] sm:h-auto rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-primary/10 border-b border-border/40 p-4 text-center relative shrink-0">
              <h2 className="font-bold text-lg text-primary font-heading">Bill #{generatedBill.billNumber}</h2>
              <p className="text-sm text-muted-foreground font-medium mt-1">Table {generatedBill.tableId?.tableNumber || '?'}</p>
              <button onClick={() => setGeneratedBill(null)} className="absolute right-4 top-4 text-foreground font-bold hover:scale-105 transition-transform"><ArrowLeft size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 font-sans hide-scrollbar">
              <div className="bg-foreground/5 border border-dashed border-border rounded-xl p-5 mb-6">
                <div className="flex justify-between items-center pt-4">
                  <span className="font-bold text-foreground font-heading">Grand Total</span>
                  <span className="font-bold text-3xl text-primary font-heading">₹{generatedBill.grandTotal}</span>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center mb-6">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-3 font-heading">Customer UPI Scan</span>
                  {generatedBill.upiQrCodeUrl ? (
                    <img src={generatedBill.upiQrCodeUrl} alt="UPI QR Code" className="w-48 h-48 object-contain border rounded-lg p-2 bg-white shadow-sm" />
                  ) : (
                    <div className="w-32 h-32 bg-foreground/5 border border-border flex items-center justify-center rounded-lg shadow-sm">
                      <Receipt size={40} className="text-muted-foreground/60" />
                    </div>
                  )}
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Button 
                  className="h-12 text-xs font-bold gap-1 bg-amber-500 hover:bg-amber-600 text-white px-1" 
                  onClick={() => handleMarkAsPaid('cash')}
                  disabled={isMarkingPaid}
                >
                  <Banknote size={14} /> Cash
                </Button>
                <Button 
                  className="h-12 text-xs font-bold gap-1 bg-blue-600 hover:bg-blue-700 text-white px-1" 
                  onClick={() => handleMarkAsPaid('card')}
                  disabled={isMarkingPaid}
                >
                  <CreditCard size={14} /> Card
                </Button>
                <Button 
                  className="h-12 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-1" 
                  onClick={() => handleMarkAsPaid('upi')}
                  disabled={isMarkingPaid}
                >
                  <CheckCircle size={14} /> UPI
                </Button>
              </div>
              <Button variant="outline" className="w-full h-12 font-bold gap-2" onClick={downloadPDF}>
                <Download size={16} /> Download PDF Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterOrderHistory;
