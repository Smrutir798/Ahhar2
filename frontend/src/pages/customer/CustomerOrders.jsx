import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '@/lib/axios';
import { CartContext } from '../../context/CartContext';
import useSocket from '../../hooks/useSocket';
import { ArrowLeft, CheckCircle2, Clock, Utensils, Receipt, Bell, Plus, MessageSquare, Droplet, Wind, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CustomerOrders = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { session } = useContext(CartContext);
  
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

  const submitFeedback = async () => {
    try {
      await axios.post('/feedback', {
        sessionId: session._id,
        tableId: session.tableId,
        restaurantId: session.restaurantId,
        ...feedbackData
      });
      setShowFeedback(false);
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
        
        const tableColumn = ["Item", "Qty", "Total (Rs)"];
        const tableRows = [];
        
        orders.forEach(order => {
          order.items.forEach(item => {
            tableRows.push([item.name, item.quantity, item.price * item.quantity]);
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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'served': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col flex-1 bg-gray-50 pb-24 relative min-h-screen">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-4">
        <button onClick={() => navigate(`/menu/table/${tableId}`)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Your Table</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Active Service Requests Tracker */}
        {activeRequests.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-blue-100">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Bell size={18} className="text-blue-500" /> Service Status
            </h3>
            <div className="space-y-3">
              {activeRequests.map(req => (
                <div key={req._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-medium text-gray-800">{req.requestType}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${req.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {req.status === 'pending' ? 'Waiting...' : `Accepted by ${req.assignedTo?.name || 'Staff'}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders List */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3 ml-1">Your Orders</h3>
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <Utensils size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h2>
              <Button onClick={() => navigate(`/menu/table/${tableId}`)} className="rounded-full">Browse Menu</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">{order.orderNumber}</h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">{item.quantity} x {item.name}</span>
                        <span className="text-gray-900 font-bold">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200">
                    <span className="text-sm text-gray-500">Total</span>
                    <span className="font-bold text-lg text-primary">₹{order.totalAmount}</span>
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
          className="fixed bottom-24 right-6 bg-primary text-white p-4 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center animate-bounce z-40"
        >
          <Bell size={28} />
        </button>
      )}

      {/* Service Panel Bottom Sheet */}
      {showServicePanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-6 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Service Request</h2>
              <button onClick={() => setShowServicePanel(false)} className="text-gray-500 font-bold text-lg">✕</button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <button onClick={() => handleServiceRequest('Call Waiter')} className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-orange-600 active:bg-orange-100">
                <Bell size={24} /> <span className="font-bold text-sm">Call Waiter</span>
              </button>
              <button onClick={() => handleServiceRequest('Water')} className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-blue-600 active:bg-blue-100">
                <Droplet size={24} /> <span className="font-bold text-sm">Need Water</span>
              </button>
              <button onClick={() => handleServiceRequest('Tissue')} className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-600 active:bg-gray-100">
                <Wind size={24} /> <span className="font-bold text-sm">Need Tissue</span>
              </button>
              <button onClick={() => handleServiceRequest('Cleaning')} className="bg-teal-50 border border-teal-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-teal-600 active:bg-teal-100">
                <Sparkles size={24} /> <span className="font-bold text-sm">Cleaning</span>
              </button>
              <button onClick={() => {
                const msg = prompt("Enter your request:");
                if(msg) handleServiceRequest('Custom', msg);
              }} className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-purple-600 active:bg-purple-100">
                <MessageSquare size={24} /> <span className="font-bold text-sm">Custom</span>
              </button>
              <button onClick={() => { setShowServicePanel(false); handleRequestBill(); }} className="bg-green-50 border border-green-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-green-600 active:bg-green-100 col-span-1 sm:col-span-1">
                <Receipt size={24} /> <span className="font-bold text-sm">Request Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Preview Modal Overlay */}
      {generatedBill && !showFeedback && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-md h-[85vh] sm:h-auto rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden">
             {/* ... (Existing Bill Preview UI) ... */}
            <div className="bg-gray-50 border-b border-gray-100 p-4 text-center relative shrink-0">
              <h2 className="font-bold text-lg text-gray-900">Your Bill</h2>
              <button onClick={() => setGeneratedBill(null)} className="absolute right-4 top-4 text-gray-400 font-bold">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-5 mb-6">
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Grand Total</span>
                  <span className="font-bold text-2xl text-primary">₹{generatedBill.grandTotal}</span>
                </div>
              </div>
              <div className="bg-white border-2 border-primary rounded-xl p-6 flex flex-col items-center justify-center mb-4">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">Pay via UPI</span>
                  <div className="w-32 h-32 bg-gray-100 flex items-center justify-center rounded-lg">
                    <Receipt size={40} className="text-gray-300" />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <Button variant="outline" className="w-full" onClick={downloadPDF}>Download PDF</Button>
                <Button variant="outline" className="w-full" onClick={() => setShowFeedback(true)}>Test Payment</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col p-6 overflow-y-auto">
          <div className="flex-1 max-w-md mx-auto w-full">
            <div className="text-center mb-8 mt-10">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
              <p className="text-gray-500 mt-2">How was your experience today?</p>
            </div>
            
            <div className="space-y-6">
              {[
                { key: 'foodRating', label: 'Food Quality' },
                { key: 'serviceRating', label: 'Service & WaitStaff' },
                { key: 'cleanlinessRating', label: 'Ambiance & Cleanliness' }
              ].map(ratingItem => (
                <div key={ratingItem.key} className="bg-gray-50 p-4 rounded-2xl">
                  <p className="font-bold text-gray-800 text-center mb-3">{ratingItem.label}</p>
                  <div className="flex justify-center gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button
                        key={star}
                        onClick={() => setFeedbackData(p => ({ ...p, [ratingItem.key]: star }))}
                        className={`text-3xl ${feedbackData[ratingItem.key] >= star ? 'text-yellow-400' : 'text-gray-300'} transition-colors`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="bg-gray-50 p-4 rounded-2xl">
                 <p className="font-bold text-gray-800 mb-3">Any specific feedback?</p>
                 <textarea 
                   value={feedbackData.comments}
                   onChange={e => setFeedbackData(p => ({ ...p, comments: e.target.value }))}
                   className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                   rows="3"
                   placeholder="Tell us what you loved or how we can improve..."
                 ></textarea>
              </div>
            </div>
            
            <Button onClick={submitFeedback} className="w-full mt-8 rounded-full py-6 text-lg shadow-lg shadow-primary/30">
              Submit Feedback
            </Button>
            <button onClick={() => navigate(`/menu/table/${tableId}`)} className="w-full mt-4 text-gray-500 font-bold text-sm">
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Reorder Button */}
      {orders.length > 0 && !showFeedback && (
        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-20 pointer-events-none">
          <button 
            className="w-full max-w-sm bg-gray-900 text-white rounded-full p-4 font-bold flex justify-center items-center shadow-xl pointer-events-auto shadow-gray-900/20"
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
