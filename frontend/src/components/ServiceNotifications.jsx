import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import { Bell, Check, X } from 'lucide-react';

const ServiceNotifications = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Audio for notification
  const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/services', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(res.data);
      } catch (err) {
        console.error('Failed to fetch service requests', err);
      }
    };
    if (user) {
      fetchRequests();
    }
  }, [user]);

  useSocket({ type: 'restaurant', id: user?.restaurantId || user?.id }, {
    'new-service-request': (newReq) => {
      notificationSound.play().catch(e => console.log('Audio play failed', e));
      setRequests(prev => [newReq, ...prev]);
    }
  });

  const markAsComplete = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Optimistic UI Update (remove immediately to feel responsive)
    setRequests(prev => prev.filter(req => req._id !== id));
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/services/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to complete service request', err);
      // If it fails, we could optionally revert the UI state here
    }
  };

  const getRequestText = (type) => {
    switch(type) {
      case 'waiter': return 'Call Waiter';
      case 'water': return 'Water Refill';
      case 'bill': return 'Request Bill';
      default: return 'Service Request';
    }
  };

  const getRequestColor = (type) => {
    switch(type) {
      case 'waiter': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'water': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'bill': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} className="text-gray-700" />
        {requests.length > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {requests.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            {requests.length > 0 && (
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full font-bold">
                {requests.length} Pending
              </span>
            )}
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {requests.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No active service requests.
              </div>
            ) : (
              <div className="flex flex-col p-2 gap-2">
                {requests.map(req => (
                  <div key={req._id} className={`rounded-lg border p-3 ${getRequestColor(req.requestType)}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm">{getRequestText(req.requestType)}</h4>
                        <p className="text-xs opacity-80 mt-0.5">Table {req.tableId?.tableNumber || '?'}</p>
                      </div>
                      <button 
                        onClick={(e) => markAsComplete(req._id, e)}
                        className="bg-white/60 hover:bg-white text-xs font-bold px-3 py-1.5 rounded shadow-sm border border-black/10 transition-colors flex items-center gap-1"
                      >
                        <Check size={14} /> Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceNotifications;
