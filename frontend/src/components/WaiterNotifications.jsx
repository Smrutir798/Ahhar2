import React, { useState, useEffect, useContext } from 'react';
import useSocket from '../hooks/useSocket';
import { AuthContext } from '../context/AuthContext';
import { BellRing, X } from 'lucide-react';

const WaiterNotifications = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);

  useSocket({ type: 'restaurant', id: user?.restaurantId || user?._id }, {
    'order-updated': (order) => {
      if (order.status === 'ready') {
        const id = Math.random().toString(36).substring(2, 9);
        const newNotif = {
          id,
          message: `Food ready for Table ${order.tableId?.tableNumber || '?'}!`,
          details: `${order.items?.length || 0} items to pick up`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setNotifications(prev => [newNotif, ...prev]);

        // Auto remove after 8 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 8000);
      }
    }
  });

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map(notif => (
        <div 
          key={notif.id} 
          className="bg-black text-white p-4 rounded-2xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-right-8 fade-in pointer-events-auto border border-gray-800"
        >
          <div className="bg-white/10 p-2 rounded-full mt-0.5">
            <BellRing size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-base leading-tight">{notif.message}</h4>
            {notif.details && <p className="text-sm text-gray-300 mt-1">{notif.details}</p>}
            <p className="text-xs text-gray-400 mt-2 font-medium">{notif.timestamp}</p>
          </div>
          <button 
            onClick={() => removeNotification(notif.id)}
            className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-full"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default WaiterNotifications;
