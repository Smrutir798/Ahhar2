import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import { FileText, CheckCircle2, Banknote, CreditCard, ScanLine, Printer } from 'lucide-react';

const BillingDashboard = () => {
  const { user } = useContext(AuthContext);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'

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

  useEffect(() => {
    if (user?.restaurantId) {
      fetchBills();
    }
  }, [user]);

  // Listen for new bills and paid bills
  useSocket({ type: 'restaurant', id: user?.restaurantId }, {
    'new-bill': (newBill) => {
      setBills(prev => [newBill, ...prev]);
    },
    'bill-paid': (paidBill) => {
      setBills(prev => prev.map(b => b._id === paidBill._id ? paidBill : b));
    }
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

  const pendingBills = bills.filter(b => b.paymentStatus === 'pending');
  const completedBills = bills.filter(b => b.paymentStatus === 'paid');
  const displayBills = activeTab === 'pending' ? pendingBills : completedBills;

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Billing System...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing POS</h1>
          <p className="text-gray-500 text-sm">Manage active sessions and process payments</p>
        </div>
        
        <div className="bg-gray-100 p-1 rounded-lg flex shadow-inner">
          <button 
            className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Payments ({pendingBills.length})
          </button>
          <button 
            className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${activeTab === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed Bills
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayBills.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-gray-50 border border-dashed rounded-xl">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-700">No {activeTab} bills found</h3>
          </div>
        ) : (
          displayBills.map(bill => (
            <div key={bill._id} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">Table {bill.tableId?.tableNumber || '?'}</h3>
                  <p className="text-xs text-gray-500 font-mono">{bill.billNumber}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {bill.paymentStatus.toUpperCase()}
                </div>
              </div>
              
              <div className="p-4 flex-1">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Subtotal</span>
                  <span>₹{bill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>CGST</span>
                  <span>₹{bill.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-3">
                  <span>SGST</span>
                  <span>₹{bill.sgst.toFixed(2)}</span>
                </div>
                {bill.serviceCharge > 0 && (
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span>Service Charge</span>
                    <span>₹{bill.serviceCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 mt-1 flex justify-between items-center">
                  <span className="font-bold">Grand Total</span>
                  <span className="font-bold text-xl text-primary">₹{bill.grandTotal}</span>
                </div>
              </div>
              
              <div className="p-4 border-t bg-gray-50">
                {bill.paymentStatus === 'pending' ? (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center mb-2">Mark as Paid</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => markAsPaid(bill._id, 'cash')}
                        className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      >
                        <Banknote size={18} className="mb-1" />
                        <span className="text-xs font-bold">Cash</span>
                      </button>
                      <button 
                        onClick={() => markAsPaid(bill._id, 'upi')}
                        className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <ScanLine size={18} className="mb-1" />
                        <span className="text-xs font-bold">UPI</span>
                      </button>
                      <button 
                        onClick={() => markAsPaid(bill._id, 'card')}
                        className="flex flex-col items-center justify-center p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                      >
                        <CreditCard size={18} className="mb-1" />
                        <span className="text-xs font-bold">Card</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center text-green-600 font-bold">
                      <CheckCircle2 size={16} className="mr-1" /> Paid via {bill.paymentMethod.toUpperCase()}
                    </div>
                    <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-md transition-colors">
                      <Printer size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BillingDashboard;
