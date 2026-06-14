import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '@/lib/axios';
import { CartContext } from '../../context/CartContext';
import useSocket from '../../hooks/useSocket';
import { ArrowLeft, CheckCircle, Clock, Utensils, Receipt, Bell, Plus, MessageSquare, Droplet, Wind, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CustomerOrders = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { session, setSession } = useContext(CartContext);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [activeRequests, setActiveRequests] = useState([]);
  const [showServicePanel, setShowServicePanel] = useState(false);
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ foodRating: 5, serviceRating: 5, cleanlinessRating: 5, comments: '' });

  // Listen to live socket events for this session
  useSocket({ type: 'session', id: session?._id }, {
    'order-status-changed': (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    },
    'service-request-accepted': (updatedReq) => {
      setActiveRequests(prev => prev.map(r => r._id === updatedReq._id ? updatedReq : r));
    },
    'service-request-completed': (updatedReq) => {
      setActiveRequests(prev => prev.filter(r => r._id !== updatedReq._id));
    },
    'bill-paid': () => {
      // Show feedback form when bill is paid
      setGeneratedBill(null);
      setShowFeedback(true);
    }
  });

  useEffect(() => {
    const fetchOrders = async () => {
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        const [ordersRes, requestsRes] = await Promise.all([
          axios.get(`/customer/orders/session/${session._id}`),
          axios.get(`/customer/service-request/session/${session._id}`)
        ]);
        
        setOrders(ordersRes.data);
        setActiveRequests(requestsRes.data);
        
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

  const handleServiceRequest = async (type, customMessage = '') => {
    try {
      const res = await axios.post('/customer/service-request', {
        tableId: session.tableId,
        restaurantId: session.restaurantId,
        sessionId: session._id,
        requestType: type,
        customMessage
      });
      setActiveRequests(prev => [...prev, res.data]);
      setShowServicePanel(false);
    } catch (err) {
      alert("Failed to send request.");
    }
  };

  const handleRequestBill = async () => {
    setIsGenerating(true);
    try {
      await handleServiceRequest('Bill');
      const res = await axios.post(`/bills/generate/${session._id}`);
      setGeneratedBill(res.data);
    } catch (err) {
      alert("Failed to generate bill.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      const { data: orderData } = await axios.post('/payments/create-order', { billId: generatedBill._id });
      
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Ahhar Restaurant",
        description: `Bill ${generatedBill.billNumber}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            await axios.post('/payments/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              billId: generatedBill._id
            });
          } catch (err) {
            alert("Payment verification failed.");
          }
        },
        prefill: { name: "Customer" },
        theme: { color: "#000000" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to initiate payment");
    }
  };

  const submitFeedback = async () => {
    try {
      await axios.post('/feedback', {
        sessionId: session._id,
        tableId: session.tableId,
        restaurantId: session.restaurantId,
        ...feedbackData
      });
      setShowFeedback(false);
      setSession(null); // Clear session so table resets
      navigate(`/menu/table/${tableId}`); // Return to menu fresh
    } catch (err) {
      alert("Failed to submit feedback");
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
      case 'pending': return 'bg-foreground/10 text-foreground border-border';
      case 'preparing': return 'bg-foreground/20 text-foreground border-border/80';
      case 'ready': return 'bg-foreground text-background border-transparent font-semibold';
      case 'served': return 'bg-background text-muted-foreground border-border opacity-70';
      default: return 'bg-foreground/5 text-foreground border-border';
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-foreground font-heading">Loading...</div>;

  return (
    <div className="flex flex-col flex-1 bg-transparent pb-24 relative min-h-screen text-foreground transition-colors duration-300">
      {/* Header */}
      <div className="bg-card/40 backdrop-blur-xl border-b border-border/40 px-4 py-4 sticky top-0 z-10 shadow-lg flex items-center gap-4">
        <button onClick={() => navigate(`/menu/table/${tableId}`)} className="p-2 -ml-2 rounded-full hover:bg-foreground/5 text-foreground">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold font-heading flex-1">Your Table</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Active Service Requests Tracker */}
        {activeRequests.length > 0 && (
          <div className="bg-card/30 rounded-2xl p-5 shadow-sm border border-border">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 font-heading">
              <Bell size={18} className="text-foreground" /> Service Status
            </h3>
            <div className="space-y-3">
              {activeRequests.map(req => (
                <div key={req._id} className="flex justify-between items-center bg-foreground/5 p-3 rounded-xl border border-border/40">
                  <span className="font-medium text-foreground">{req.requestType}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md border ${req.status === 'pending' ? 'bg-foreground/10 text-foreground border-border' : 'bg-foreground text-background border-transparent'}`}>
                    {req.status === 'pending' ? 'Waiting...' : `Accepted by ${req.assignedTo?.name || 'Staff'}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders List */}
        <div>
          <h3 className="font-bold text-foreground mb-3 ml-1 font-heading">Your Orders</h3>
          {orders.length === 0 ? (
            <div className="bg-card/30 rounded-2xl p-8 text-center shadow-sm border border-border">
              <Utensils size={48} className="mx-auto text-muted-foreground/60 mb-4" />
              <h2 className="text-lg font-bold text-foreground mb-2 font-heading">No orders yet</h2>
              <Button onClick={() => navigate(`/menu/table/${tableId}`)} className="rounded-full">Browse Menu</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-card/30 rounded-2xl p-5 shadow-sm border border-border hover:border-foreground/20 transition-all duration-300">
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
                        {item.instructions && (
                          <div className="text-[11px] text-destructive italic ml-6">
                            Note: {item.instructions}
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

      {/* Floating Action Button for Service Panel */}
      {session && !showServicePanel && !generatedBill && !showFeedback && (
        <button 
          onClick={() => setShowServicePanel(true)}
          className="fixed bottom-24 right-6 bg-foreground text-background p-4 rounded-full shadow-lg shadow-foreground/10 flex items-center justify-center animate-bounce z-40 border border-border"
        >
          <Bell size={28} />
        </button>
      )}

      {/* Service Panel Bottom Sheet */}
      {showServicePanel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex flex-col justify-end">
          <div className="bg-card border-t border-border rounded-t-3xl p-6 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-heading">Service Request</h2>
              <button onClick={() => setShowServicePanel(false)} className="text-foreground font-bold text-lg hover:scale-105 active:scale-95 transition-transform">✕</button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <button onClick={() => handleServiceRequest('Call Waiter')} className="bg-foreground/5 border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-foreground active:bg-foreground/15 hover:scale-[1.02] transition-all duration-200">
                <Bell size={24} /> <span className="font-bold text-sm font-heading">Call Waiter</span>
              </button>
              <button onClick={() => handleServiceRequest('Water')} className="bg-foreground/5 border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-foreground active:bg-foreground/15 hover:scale-[1.02] transition-all duration-200">
                <Droplet size={24} /> <span className="font-bold text-sm font-heading">Need Water</span>
              </button>
              <button onClick={() => handleServiceRequest('Tissue')} className="bg-foreground/5 border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-foreground active:bg-foreground/15 hover:scale-[1.02] transition-all duration-200">
                <Wind size={24} /> <span className="font-bold text-sm font-heading">Need Tissue</span>
              </button>
              <button onClick={() => handleServiceRequest('Cleaning')} className="bg-foreground/5 border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-foreground active:bg-foreground/15 hover:scale-[1.02] transition-all duration-200">
                <Sparkles size={24} /> <span className="font-bold text-sm font-heading">Cleaning</span>
              </button>
              <button onClick={() => {
                const msg = prompt("Enter your request:");
                if(msg) handleServiceRequest('Custom', msg);
              }} className="bg-foreground/5 border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-foreground active:bg-foreground/15 hover:scale-[1.02] transition-all duration-200">
                <MessageSquare size={24} /> <span className="font-bold text-sm font-heading">Custom</span>
              </button>
              <button onClick={() => { setShowServicePanel(false); handleRequestBill(); }} className="bg-foreground/5 border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-foreground active:bg-foreground/15 hover:scale-[1.02] transition-all duration-200">
                <Receipt size={24} /> <span className="font-bold text-sm font-heading">Request Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Preview Modal Overlay */}
      {generatedBill && !showFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full sm:max-w-md h-[85vh] sm:h-auto rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-foreground/5 border-b border-border/40 p-4 text-center relative shrink-0">
              <h2 className="font-bold text-lg text-foreground font-heading">Your Bill</h2>
              <p className="text-sm text-muted-foreground font-medium mt-1">Table {generatedBill.tableId?.tableNumber || '?'}</p>
              <button onClick={() => setGeneratedBill(null)} className="absolute right-4 top-4 text-foreground font-bold hover:scale-105 transition-transform">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 font-sans hide-scrollbar">
              <div className="bg-foreground/5 border border-dashed border-border rounded-xl p-5 mb-6">
                <div className="flex justify-between items-center pt-4">
                  <span className="font-bold text-foreground font-heading">Grand Total</span>
                  <span className="font-bold text-2xl text-foreground font-heading">₹{generatedBill.grandTotal}</span>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center mb-6">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-3 font-heading">Scan to Pay via UPI</span>
                  {generatedBill.upiQrCodeUrl ? (
                    <img src={generatedBill.upiQrCodeUrl} alt="UPI QR Code" className="w-40 h-40 object-contain border rounded-lg p-1 bg-white shadow-sm" />
                  ) : (
                    <div className="w-32 h-32 bg-foreground/5 border border-border flex items-center justify-center rounded-lg shadow-sm">
                      <Receipt size={40} className="text-muted-foreground/60" />
                    </div>
                  )}
                  {generatedBill.upiUrl && (
                    <a 
                      href={generatedBill.upiUrl}
                      className="mt-4 inline-flex items-center gap-2 bg-foreground text-background text-xs font-bold px-4 py-2 rounded-full hover:opacity-90 active:scale-95 transition-all shadow-sm"
                    >
                      <Receipt size={14} /> Open UPI App
                    </a>
                  )}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <Button variant="outline" className="w-full h-12 rounded-full font-bold" onClick={downloadPDF}>Download PDF</Button>
                <Button className="w-full h-12 rounded-full font-bold" onClick={handleRazorpayPayment}>Pay via Razorpay</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex flex-col p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="flex-1 max-w-md mx-auto w-full flex flex-col justify-center">
            <div className="text-center mb-8 mt-10">
              <div className="w-16 h-16 bg-foreground text-background border border-border rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-foreground/5">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-foreground font-heading">Payment Successful!</h2>
              <p className="text-muted-foreground mt-2 font-sans">How was your experience today?</p>
            </div>
            
            <div className="space-y-6">
              {[
                { key: 'foodRating', label: 'Food Quality' },
                { key: 'serviceRating', label: 'Service & WaitStaff' },
                { key: 'cleanlinessRating', label: 'Ambiance & Cleanliness' }
              ].map(ratingItem => (
                <div key={ratingItem.key} className="bg-card/40 border border-border p-4 rounded-2xl shadow-sm text-center">
                  <p className="font-bold text-foreground mb-3 font-heading">{ratingItem.label}</p>
                  <div className="flex justify-center gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button
                        key={star}
                        onClick={() => setFeedbackData(p => ({ ...p, [ratingItem.key]: star }))}
                        className={`text-3xl ${feedbackData[ratingItem.key] >= star ? 'text-foreground' : 'text-muted-foreground/30'} hover:scale-110 active:scale-95 transition-all`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="bg-card/40 border border-border p-4 rounded-2xl shadow-sm">
                 <p className="font-bold text-foreground mb-3 font-heading">Any specific feedback?</p>
                 <textarea 
                   value={feedbackData.comments}
                   onChange={e => setFeedbackData(p => ({ ...p, comments: e.target.value }))}
                   className="w-full bg-foreground/5 border border-border text-foreground rounded-xl p-3 text-sm focus:border-foreground focus:ring-1 focus:ring-foreground transition-all resize-none outline-none font-sans"
                   rows="3"
                   placeholder="Tell us what you loved or how we can improve..."
                 ></textarea>
              </div>
            </div>
            
            <Button onClick={submitFeedback} className="w-full mt-8 rounded-full py-6 text-lg font-bold shadow-lg shadow-foreground/5">
              Submit Feedback
            </Button>
            <button onClick={() => {
              setSession(null);
              navigate(`/menu/table/${tableId}`);
            }} className="w-full mt-4 text-muted-foreground hover:text-foreground font-bold text-sm hover:underline transition-all duration-200">
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Reorder Button */}
      {orders.length > 0 && !showFeedback && (
        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-20 pointer-events-none">
          <button 
            className="w-full max-w-sm bg-foreground text-background rounded-full p-4 font-bold flex justify-center items-center shadow-xl pointer-events-auto border border-border hover:scale-[1.02] active:scale-95 transition-all duration-300"
            onClick={() => navigate(`/menu/table/${tableId}`)}
          >
            <Plus size={20} className="mr-2" /> Order More Food
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
