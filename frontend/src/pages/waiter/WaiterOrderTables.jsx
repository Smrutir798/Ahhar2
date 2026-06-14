import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';

const WaiterOrderTables = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await axios.get('/tables/live-status');
        setTables(res.data);
      } catch (err) {
        console.error('Failed to fetch tables', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  useSocket({ type: 'restaurant', id: user?.restaurantId || user?._id }, {
    'table-occupied': ({ tableId }) => {
      setTables(prev => prev.map(t => t._id === tableId ? { ...t, status: 'occupied' } : t));
    },
    'new-bill': (newBill) => {
      setTables(prev => prev.map(t => t._id === newBill.tableId ? { ...t, status: 'billing' } : t));
    },
    'bill-paid': (paidBill) => {
      const tId = paidBill.tableId._id || paidBill.tableId;
      setTables(prev => prev.map(t => t._id === tId ? { ...t, status: 'available' } : t));
    },
    'session-closed': (closedSession) => {
      const tId = closedSession.tableId._id || closedSession.tableId;
      setTables(prev => prev.map(t => t._id === tId ? { ...t, status: 'available' } : t));
    }
  });

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground p-6">Loading Tables...</div>;
  }

  return (
    <div className="p-4 flex flex-col flex-1 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground mb-1">Select Table</h1>
        <p className="text-sm text-muted-foreground">Choose a table to take an order</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tables.map(table => (
          <button 
            key={table._id}
            onClick={() => navigate(`/waiter/order/${table._id}`)}
            className={`
              relative p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm
              ${table.status === 'available' ? 'bg-card border-border hover:border-primary/50' : ''}
              ${table.status === 'occupied' ? 'bg-primary/5 border-primary/30 shadow-primary/5' : ''}
              ${table.status === 'billing' ? 'bg-amber-500/10 border-amber-500/30' : ''}
            `}
          >
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold font-heading mb-1 shadow-sm
              ${table.status === 'available' ? 'bg-foreground/5 text-foreground' : ''}
              ${table.status === 'occupied' ? 'bg-primary/20 text-primary' : ''}
              ${table.status === 'billing' ? 'bg-amber-500/20 text-amber-600' : ''}
            `}>
              {table.tableNumber}
            </div>
            <div className={`text-xs font-bold uppercase tracking-wider ${
              table.status === 'available' ? 'text-muted-foreground' : 
              table.status === 'occupied' ? 'text-primary' : 'text-amber-600'
            }`}>
              {table.status}
            </div>
            
            {table.capacity && (
              <div className="absolute top-2 right-2 text-[10px] font-bold text-muted-foreground bg-foreground/5 px-1.5 py-0.5 rounded">
                {table.capacity} pax
              </div>
            )}
          </button>
        ))}
      </div>
      
      {tables.length === 0 && (
        <div className="text-center p-8 bg-foreground/5 rounded-2xl border border-border/50 text-muted-foreground mt-4">
          No tables found for this restaurant.
        </div>
      )}
    </div>
  );
};

export default WaiterOrderTables;
