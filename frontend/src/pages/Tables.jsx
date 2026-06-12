import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const Tables = () => {
  const { user } = useContext(AuthContext);
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: '' });
  
  const fetchTables = async () => {
    try {
      const res = await axios.get('/tables');
      setTables(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

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
    <div className="space-y-8 animate-fade-in text-foreground">
      <div>
        <h1 className="text-4xl font-bold font-heading tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/50 animate-slide-up">Table Management</h1>
        <p className="text-muted-foreground mt-2 font-sans">Manage your restaurant layout and generate QR codes.</p>
      </div>
      
      <Card className="max-w-xl animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle>Add New Table</CardTitle>
          <CardDescription>Create a new table and generate its QR code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTable} className="flex gap-4 items-end">
            <div className="grid gap-2 flex-1 font-sans">
              <Label htmlFor="tableNumber">Table Number</Label>
              <Input id="tableNumber" type="number" required value={newTable.tableNumber} onChange={e => setNewTable({...newTable, tableNumber: e.target.value})} />
            </div>
            <div className="grid gap-2 flex-1 font-sans">
              <Label htmlFor="capacity">Capacity (Persons)</Label>
              <Input id="capacity" type="number" required value={newTable.capacity} onChange={e => setNewTable({...newTable, capacity: e.target.value})} />
            </div>
            <Button type="submit" className="shadow-md">Add Table</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
        {tables.map(table => (
          <Card key={table._id} className="overflow-hidden relative group hover:border-foreground/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <CardHeader className="bg-foreground/5 pb-4 border-b border-border/40 z-10 relative">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Table {table.tableNumber}</CardTitle>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${table.status === 'available' ? 'bg-foreground/10 text-foreground border-border' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                  {table.status}
                </span>
              </div>
              <CardDescription>Capacity: {table.capacity}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center">
              {table.qrCodeUrl && (
                <div className="bg-white p-2 rounded-lg border border-border/40 mb-4">
                  <img src={table.qrCodeUrl} alt={`QR Code for Table ${table.tableNumber}`} className="w-32 h-32" />
                </div>
              )}
              <div className="flex gap-3 w-full mt-2">
                <Button variant="outline" className="flex-1 font-heading" onClick={() => downloadQR(table.qrCodeUrl, table.tableNumber)}>
                  Download QR
                </Button>
                <Button variant="destructive" size="icon" className="shadow-sm" onClick={() => handleDelete(table._id)}>
                  X
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {tables.length === 0 && <p className="text-muted-foreground col-span-full font-sans">No tables found. Add one above.</p>}
      </div>
    </div>
  );
};

export default Tables;
