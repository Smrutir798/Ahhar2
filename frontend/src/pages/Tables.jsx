import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Download, Trash2, QrCode } from 'lucide-react';

const Tables = () => {
  const { user } = useContext(AuthContext);
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: '' });
  const [waiters, setWaiters] = useState([]);
  
  const fetchTables = async () => {
    try {
      const res = await axios.get('/tables/live-status');
      setTables(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWaiters = async () => {
    try {
      const res = await axios.get('/staff');
      const filtered = res.data.filter(member => member.role === 'waiter');
      setWaiters(filtered);
    } catch (err) {
      console.error('Failed to fetch waiters:', err);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchWaiters();
  }, []);

  const handleAssignWaiter = async (tableId, waiterId) => {
    try {
      await axios.put(`/tables/${tableId}`, { assignedWaiter: waiterId || null });
      fetchTables();
    } catch (err) {
      console.error('Failed to assign waiter:', err);
      alert('Failed to assign waiter: ' + (err.response?.data?.message || err.message));
    }
  };

  // Listen for live table status updates
  useSocket({ type: 'restaurant', id: user?.restaurantId || user?._id }, {
    'table-occupied': ({ tableId }) => {
      setTables(prev => prev.map(t => t._id === tableId ? { ...t, status: 'occupied' } : t));
    },
    'new-bill': (newBill) => {
      // when bill is generated, table status changes to billing
      setTables(prev => prev.map(t => t._id === newBill.tableId ? { ...t, status: 'billing' } : t));
    },
    'bill-paid': (paidBill) => {
      // when bill is paid, table status changes to available
      // Check if tableId is an object (populated) or just an ID string
      const tId = paidBill.tableId._id || paidBill.tableId;
      setTables(prev => prev.map(t => t._id === tId ? { ...t, status: 'available' } : t));
    }
  });

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/tables', {
        tableNumber: parseInt(newTable.tableNumber),
        capacity: parseInt(newTable.capacity)
      });
      setNewTable({ tableNumber: '', capacity: '' });
      fetchTables();
    } catch (err) {
      console.error('Failed to add table', err);
      alert(err.response?.data?.message || 'Failed to add table');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this table?")) return;
    try {
      await axios.delete(`/tables/${id}`);
      fetchTables();
    } catch (err) {
      console.error('Failed to delete table', err);
      alert('Failed to delete table: ' + (err.response?.data?.message || err.message));
    }
  };

  const downloadQR = (url, tableNumber) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `table-${tableNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in text-foreground pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-black">Table Management</h1>
          <p className="text-muted-foreground mt-1 text-sm font-sans">Manage your restaurant layout and generate QR codes.</p>
        </div>
        
        <Card className="bg-white shadow-sm border border-gray-200/60 rounded-[16px] overflow-hidden shrink-0">
          <div className="p-2 px-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <QrCode size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-600">Quick Add Table</span>
          </div>
          <CardContent className="p-3">
            <form onSubmit={handleAddTable} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="tableNumber" className="text-xs font-bold text-gray-500 hidden sm:block">No.</Label>
                <Input 
                  id="tableNumber" 
                  type="number" 
                  required 
                  className="bg-gray-50 border-gray-200 focus-visible:ring-black h-9 w-20 text-center rounded-lg"
                  placeholder="e.g. 1"
                  value={newTable.tableNumber} 
                  onChange={e => setNewTable({...newTable, tableNumber: e.target.value})} 
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="capacity" className="text-xs font-bold text-gray-500 hidden sm:block">Seats</Label>
                <Input 
                  id="capacity" 
                  type="number" 
                  required 
                  className="bg-gray-50 border-gray-200 focus-visible:ring-black h-9 w-20 text-center rounded-lg"
                  placeholder="e.g. 4"
                  value={newTable.capacity} 
                  onChange={e => setNewTable({...newTable, capacity: e.target.value})} 
                />
              </div>
              <Button type="submit" className="h-9 px-4 bg-black text-white hover:bg-gray-900 rounded-lg shadow-sm font-bold text-xs">
                Add
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
        {tables.map(table => (
          <Card key={table._id} className="overflow-hidden relative group hover:border-black/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white shadow-sm border border-gray-200 rounded-[24px]">
            <CardHeader className="p-5 pb-0 border-b-0 z-10 relative">
              <div className="flex justify-between items-start mb-1">
                <CardTitle className="text-3xl font-black font-heading tracking-tight text-black flex items-center gap-2">
                  <span className="text-gray-400 text-lg font-medium">#</span>{table.tableNumber}
                </CardTitle>
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm ${table.status === 'available' ? 'bg-green-500 text-white' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {table.status}
                </span>
              </div>
              <CardDescription className="text-sm font-medium text-gray-500 mt-1">
                {table.capacity} Seats
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-5 flex flex-col items-center">
              {table.qrCodeUrl && (
                <div className="bg-white p-3 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 my-4 relative group-hover:scale-105 transition-transform duration-500">
                  <img src={table.qrCodeUrl} alt={`QR Code for Table ${table.tableNumber}`} className="w-32 h-32 object-contain" />
                </div>
              )}
              
              {table.activeSession && table.orders && table.orders.length > 0 && (
                <div className="w-full mb-5 bg-gray-50 p-3 rounded-xl border border-gray-100 relative overflow-hidden">
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span>
                    Live Orders
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                       const counts = table.orders.reduce((acc, order) => {
                         acc[order.status] = (acc[order.status] || 0) + 1;
                         return acc;
                       }, {});
                       return Object.entries(counts).map(([status, count]) => (
                         <span key={status} className={`px-2 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1.5 ${
                           status === 'pending' ? 'bg-amber-100 text-amber-800' :
                           status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                           status === 'ready' ? 'bg-emerald-100 text-emerald-800' :
                           'bg-gray-200 text-gray-800'
                         }`}>
                           <span className="bg-white/80 rounded-full w-4 h-4 flex items-center justify-center shadow-sm">{count}</span>
                           {status.toUpperCase().substring(0,4)}
                         </span>
                       ));
                    })()}
                  </div>
                </div>
              )}
              
              {/* Waiter Assignment Dropdown */}
              <div className="w-full mb-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100/80">
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Assigned Waiter</label>
                <select
                  value={table.assignedWaiter?._id || table.assignedWaiter || ''}
                  onChange={(e) => handleAssignWaiter(table._id, e.target.value)}
                  className="w-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 py-1.5 px-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 transition-all cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {waiters.map(waiter => (
                    <option key={waiter._id} value={waiter._id}>
                      {waiter.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2 w-full mt-auto pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 h-10 font-bold font-heading gap-2 bg-white hover:bg-gray-50 border-gray-200 shadow-sm transition-all rounded-xl text-black" 
                  onClick={() => downloadQR(table.qrCodeUrl, table.tableNumber)}
                >
                  <Download size={16} />
                  QR Code
                </Button>
                <Button 
                  variant="outline" 
                  className="h-10 w-12 p-0 text-red-500 hover:text-white hover:bg-red-500 border-gray-200 shadow-sm transition-all rounded-xl" 
                  onClick={() => handleDelete(table._id)}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {tables.length === 0 && <p className="text-gray-400 col-span-full font-sans text-sm p-8 text-center border-2 border-dashed border-gray-200 rounded-[20px]">No tables found. Add one above.</p>}
      </div>
    </div>
  );
};

export default Tables;
