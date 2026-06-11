import React, { useEffect, useState, useContext } from 'react';
import axios from '@/lib/axios';
import useSocket from '../../hooks/useSocket';
import { AuthContext } from '../../context/AuthContext';
import { Bell, Clock, ChefHat, CheckCircle2, User } from 'lucide-react';

const formatTimeAgo = (dateString) => {
  const diffInMinutes = Math.floor((new Date() - new Date(dateString)) / 60000);
  if (diffInMinutes < 1) return 'Just now';
  return `${diffInMinutes} min ago`;
};

const KitchenDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0, today: 0 });

  // Add a generic beep sound (Data URI for simple sine wave or use a CDN audio)
  const beepSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

  // Socket logic
  useSocket({ type: 'restaurant', id: user?.restaurantId }, {
    'new-order': (newOrder) => {
      beepSound.play().catch(e => console.log('Audio play failed', e));
      setOrders(prev => [...prev, newOrder]);
    },
    'order-updated': (updatedOrder) => {
      setOrders(prev => {
        if (updatedOrder.status === 'served') {
          return prev.filter(o => o._id !== updatedOrder._id);
        }
        return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
      });
    }
  });

  useEffect(() => {
    if (!user?.restaurantId) return;
    
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/kitchen/orders/${user.restaurantId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      }
    };
    fetchOrders();
  }, [user]);

  useEffect(() => {
    // Calculate stats
    setStats({
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing' || o.status === 'accepted').length,
      ready: orders.filter(o => o.status === 'ready').length,
      today: orders.length // Simplification
    });
  }, [orders]);

  const updateStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/kitchen/orders/${orderId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Socket will broadcast the update and update our state
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const OrderCard = ({ order }) => (
    <div className="bg-gray-800 rounded-lg p-4 mb-3 border border-gray-700 shadow-md flex flex-col">
      <div className="flex justify-between items-start mb-3 border-b border-gray-700 pb-2">
        <div>
          <h3 className="font-bold text-white text-lg">Table {order.tableId?.tableNumber || '?'}</h3>
          <p className="text-xs text-gray-400">{order.orderNumber}</p>
        </div>
        <div className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2 py-1 rounded text-xs font-bold">
          <Clock size={12} />
          {formatTimeAgo(order.createdAt)}
        </div>
      </div>
      
      <div className="flex-1 space-y-2 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <div className="flex gap-2 text-gray-200">
              <span className="font-bold">{item.quantity}x</span>
              <span>{item.name}</span>
            </div>
            {item.instructions && (
              <p className="text-xs text-red-400 mt-0.5 ml-6">Note: {item.instructions}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto flex gap-2">
        {order.status === 'pending' && (
          <button onClick={() => updateStatus(order._id, 'accepted')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">
            Accept
          </button>
        )}
        {order.status === 'accepted' && (
          <button onClick={() => updateStatus(order._id, 'preparing')} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded">
            Start Cooking
          </button>
        )}
        {order.status === 'preparing' && (
          <button onClick={() => updateStatus(order._id, 'ready')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded">
            Mark Ready
          </button>
        )}
        {order.status === 'ready' && (
          <button onClick={() => updateStatus(order._id, 'served')} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded">
            Mark Served
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ChefHat className="text-primary" size={28} />
          <h1 className="text-xl font-bold">Kitchen Display System</h1>
        </div>
        
        <div className="flex gap-4">
          <div className="flex gap-3 text-sm">
            <div className="bg-gray-800 px-3 py-1.5 rounded border border-gray-700">Pending <span className="font-bold text-blue-400">{stats.pending}</span></div>
            <div className="bg-gray-800 px-3 py-1.5 rounded border border-gray-700">Preparing <span className="font-bold text-orange-400">{stats.preparing}</span></div>
            <div className="bg-gray-800 px-3 py-1.5 rounded border border-gray-700">Ready <span className="font-bold text-green-400">{stats.ready}</span></div>
          </div>
          <button onClick={logout} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-1.5 rounded font-bold transition-colors">
            Logout
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden h-[calc(100vh-73px)]">
        
        {/* Pending Column */}
        <div className="flex flex-col h-full">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-t-lg p-3 mb-2 flex justify-between items-center">
            <h2 className="font-bold text-blue-400 flex items-center gap-2"><Bell size={18}/> Pending</h2>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold">{stats.pending}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 pb-4">
            {orders.filter(o => o.status === 'pending').map(order => <OrderCard key={order._id} order={order} />)}
          </div>
        </div>

        {/* Accepted/Preparing Column */}
        <div className="flex flex-col h-full">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-t-lg p-3 mb-2 flex justify-between items-center">
            <h2 className="font-bold text-orange-400 flex items-center gap-2"><ChefHat size={18}/> Preparing</h2>
            <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-xs font-bold">{stats.preparing}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 pb-4">
            {orders.filter(o => o.status === 'accepted' || o.status === 'preparing').map(order => <OrderCard key={order._id} order={order} />)}
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex flex-col h-full">
          <div className="bg-green-500/10 border border-green-500/20 rounded-t-lg p-3 mb-2 flex justify-between items-center">
            <h2 className="font-bold text-green-400 flex items-center gap-2"><CheckCircle2 size={18}/> Ready</h2>
            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold">{stats.ready}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 pb-4">
            {orders.filter(o => o.status === 'ready').map(order => <OrderCard key={order._id} order={order} />)}
          </div>
        </div>

        {/* Served Column (Recent) */}
        <div className="flex flex-col h-full opacity-60">
          <div className="bg-gray-500/10 border border-gray-500/20 rounded-t-lg p-3 mb-2 flex justify-between items-center">
            <h2 className="font-bold text-gray-400 flex items-center gap-2"><User size={18}/> Served (History hidden)</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-lg text-gray-600 p-8 text-center">
            <CheckCircle2 size={48} className="mb-4 opacity-50" />
            <p>Orders disappear once marked as served to keep the dashboard clean.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default KitchenDashboard;
