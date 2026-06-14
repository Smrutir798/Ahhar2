import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import { Bell, Droplet, Wind, Sparkles, Receipt, HelpCircle, CheckCircle, ClipboardList, Clock } from 'lucide-react';
import WaiterNotifications from '../../components/WaiterNotifications';

const getRequestIcon = (type) => {
  switch(type) {
    case 'Call Waiter': return <Bell className="text-black" size={20} />;
    case 'Water': return <Droplet className="text-blue-500" size={20} />;
    case 'Tissue': return <Wind className="text-gray-500" size={20} />;
    case 'Cleaning': return <Sparkles className="text-amber-500" size={20} />;
    case 'Bill': return <Receipt className="text-emerald-600" size={20} />;
    default: return <HelpCircle className="text-gray-400" size={20} />;
  }
};

const KanbanColumn = ({ title, items, acceptRequest, completeRequest, isPending, currentWaiterId }) => (
  <div className={`flex flex-col bg-gray-100/50 rounded-3xl border border-gray-200/60 overflow-hidden h-[calc(100vh-140px)]`}>
    <div className="px-6 py-5 flex justify-between items-center border-b border-gray-200/50 bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
      <h2 className="font-bold text-black text-lg flex items-center gap-2">
        {title}
      </h2>
      <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold border border-gray-200 shadow-sm">{items.length}</span>
    </div>
    
    <div className="p-4 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <CheckCircle size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium">No requests here</p>
        </div>
      ) : (
        items.map(req => (
          <div key={req._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shadow-sm">
                  {getRequestIcon(req.requestType)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-black text-lg leading-tight">Table {req.tableId?.tableNumber || '?'}</h4>
                    {req.tableId?.assignedWaiter === currentWaiterId && (
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-amber-500 text-white rounded-md tracking-wider shadow-sm animate-pulse">
                        Your Table
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500 mt-0.5">{req.requestType}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                <Clock size={12} />
                {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            {req.customMessage && (
              <div className="bg-[#f8f9fa] p-3 rounded-xl text-sm text-gray-600 border border-gray-100 relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 rounded-l-xl"></div>
                <span className="italic">"{req.customMessage}"</span>
              </div>
            )}
            
            {req.status === 'accepted' && (
              <div className="flex items-center">
                <div className="text-[11px] text-black font-bold bg-gray-100 px-3 py-1.5 rounded-full inline-block border border-gray-200">
                  Assigned: {req.assignedTo?.name || 'Staff'}
                </div>
              </div>
            )}
            
            <div className="pt-2">
              {req.status === 'pending' && (
                <button 
                  onClick={() => acceptRequest(req._id)}
                  className="w-full bg-black hover:bg-gray-900 active:scale-[0.98] text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  Accept Request
                </button>
              )}
              {req.status === 'accepted' && (
                <button 
                  onClick={() => completeRequest(req._id)}
                  className="w-full bg-white border-2 border-black hover:bg-gray-50 active:scale-[0.98] text-black py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <CheckCircle size={18} /> Mark Completed
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const WaiterDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
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
    fetchRequests();
  }, []);

  useSocket({ type: 'restaurant', id: user?.restaurantId || user?._id }, {
    'new-service-request': (newReq) => {
      setRequests(prev => [newReq, ...prev]);
    },
    'service-request-accepted': (updatedReq) => {
      setRequests(prev => prev.map(r => r._id === updatedReq._id ? updatedReq : r));
    },
    'service-request-completed': (completedReq) => {
      setRequests(prev => prev.filter(r => r._id !== completedReq._id));
    }
  });

  const acceptRequest = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/services/${id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to accept request', err);
    }
  };

  const completeRequest = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/services/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to complete request', err);
    }
  };

  // Priority sorting logic
  const priority = { 'Bill': 1, 'Call Waiter': 2, 'Cleaning': 3, 'Water': 4, 'Tissue': 5, 'Custom': 6 };
  
  const pendingRequests = requests
    .filter(r => r.status === 'pending')
    .sort((a, b) => (priority[a.requestType] || 99) - (priority[b.requestType] || 99));
    
  const activeRequests = requests.filter(r => r.status === 'accepted');

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-screen">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 bg-gray-50 min-h-screen p-4 md:p-8 font-sans relative">
      <WaiterNotifications />
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">Waiter Operations</h1>
          <p className="text-gray-500 font-medium mt-1">Manage incoming table service requests</p>
        </div>
        <button 
          onClick={() => navigate('/waiter/order')} 
          className="bg-black text-white px-6 py-3.5 rounded-full font-bold flex items-center gap-2 hover:bg-gray-900 active:scale-95 transition-all shadow-lg w-full sm:w-auto justify-center"
        >
          <ClipboardList size={20} /> Take Order
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto w-full">
        <KanbanColumn 
          title="Pending Requests" 
          items={pendingRequests} 
          acceptRequest={acceptRequest} 
          completeRequest={completeRequest}
          isPending={true}
          currentWaiterId={user?.id}
        />
        <KanbanColumn 
          title="Active (Accepted)" 
          items={activeRequests} 
          acceptRequest={acceptRequest} 
          completeRequest={completeRequest}
          isPending={false}
          currentWaiterId={user?.id}
        />
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default WaiterDashboard;
