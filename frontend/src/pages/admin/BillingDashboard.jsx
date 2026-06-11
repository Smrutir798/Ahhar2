import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import { FileText, CheckCircle2, Banknote, CreditCard, ScanLine, Printer, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const BillingDashboard = () => {
  const { user } = useContext(AuthContext);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'

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
        {filteredBills.length === 0 ? (
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
                  {bill.paymentStatus.toUpperCase()}
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
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center mb-1">Process Payment</p>
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
                        <ScanLine size={16} className="mb-1 text-foreground" />
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
                      <CheckCircle2 size={16} className="mr-1.5" /> Paid via {bill.paymentMethod.toUpperCase()}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-foreground/10 text-muted-foreground hover:text-foreground">
                      <Printer size={16} />
                    </Button>
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
