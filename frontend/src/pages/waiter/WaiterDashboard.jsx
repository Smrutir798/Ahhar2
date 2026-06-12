import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import { Bell, Droplet, Wind, Sparkles, Receipt, HelpCircle, CheckCircle } from 'lucide-react';

const WaiterDashboard = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchRequests();
  }, [user]);

  // Socket listeners for real-time updates
  useSocket({ type: 'restaurant', id: user?.restaurantId }, {
    'new-service-request': (newReq) => {
      setRequests(prev => [newReq, ...prev]);
    },
    'service-request-accepted': (updatedReq) => {
      setRequests(prev => prev.map(r => r._id === updatedReq._id ? updatedReq : r));
    },
    'service-request-completed': (updatedReq) => {
      setRequests(prev => prev.map(r => r._id === updatedReq._id ? updatedReq : r));
    }
  });

  const acceptRequest = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/services/${id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(prev => prev.map(r => r._id === id ? res.data : r));
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  const completeRequest = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/services/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(prev => prev.map(r => r._id === id ? res.data : r));
    } catch (err) {
      alert('Failed to complete request');
    }
  };

  const getRequestIcon = (type) => {
    switch(type) {
      case 'Call Waiter': return <Bell className="text-orange-500" />;
      case 'Water': return <Droplet className="text-blue-500" />;
      case 'Tissue': return <Wind className="text-gray-500" />;
      case 'Cleaning': return <Sparkles className="text-teal-500" />;
      case 'Bill': return <Receipt className="text-purple-500" />;
      default: return <HelpCircle className="text-gray-400" />;
    }
  };

  // Priority sorting logic
  const priority = { 'Bill': 1, 'Call Waiter': 2, 'Cleaning': 3, 'Water': 4, 'Tissue': 5, 'Custom': 6 };
  
  const pendingRequests = requests
    .filter(r => r.status === 'pending')
    .sort((a, b) => (priority[a.requestType] || 99) - (priority[b.requestType] || 99));
    
  const activeRequests = requests.filter(r => r.status === 'accepted');

  const KanbanColumn = ({ title, items, colorClass }) => (
    <div className={`flex flex-col bg-gray-50 rounded-xl border border-gray-200 h-[calc(100vh-140px)] overflow-hidden ${colorClass}`}>
      <div className="p-4 border-b bg-white/50 font-bold text-gray-800 shrink-0 shadow-sm flex justify-between items-center">
        {title}
        <span className="bg-white px-2 py-0.5 rounded-full text-xs border shadow-sm">{items.length}</span>
      </div>
      <div className="p-4 overflow-y-auto flex-1 space-y-3">
        {items.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8 font-medium">No requests here</div>
        ) : (
          items.map(req => (
            <div key={req._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg border">
                    {getRequestIcon(req.requestType)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Table {req.tableId?.tableNumber || '?'}</h4>
                    <p className="text-sm font-medium text-gray-600">{req.requestType}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400 text-right">
                  {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              {req.customMessage && (
                <div className="bg-gray-50 p-2 rounded text-sm italic text-gray-600 border">
                  "{req.customMessage}"
                </div>
              )}
              
              {req.status === 'accepted' && (
                <div className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md inline-block self-start">
                  Assigned to: {req.assignedTo?.name || 'Staff'}
                </div>
              )}
              
              <div className="pt-2 border-t flex gap-2">
                {req.status === 'pending' && (
                  <button 
                    onClick={() => acceptRequest(req._id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Accept Request
                  </button>
                )}
                {req.status === 'accepted' && (
                  <button 
                    onClick={() => completeRequest(req._id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <CheckCircle size={16} /> Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Waiter Dashboard...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Waiter Operations</h1>
        <p className="text-gray-500 text-sm">Manage incoming table service requests</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KanbanColumn title="Pending" items={pendingRequests} colorClass="border-t-4 border-t-orange-400" />
        <KanbanColumn title="Active (Accepted)" items={activeRequests} colorClass="border-t-4 border-t-blue-400" />
      </div>
    </div>
  );
};

export default WaiterDashboard;
