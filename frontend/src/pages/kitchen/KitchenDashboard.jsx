import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from '@/lib/axios';
import useSocket from '../../hooks/useSocket';
import { AuthContext } from '../../context/AuthContext';
import { Bell, Clock, ChefHat, CheckCircle, User, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const formatTimeAgo = (dateString) => {
  const diffInMinutes = Math.floor((new Date() - new Date(dateString)) / 60000);
  if (diffInMinutes < 1) return 'Just now';
  return `${diffInMinutes} min ago`;
};

const OrderCard = ({ order, updateStatus }) => (
  <Card className="p-4 mb-3 flex flex-col hover:border-foreground/30 hover:shadow-lg transition-all duration-300">
    <div className="flex justify-between items-start mb-3 border-b border-border/10 pb-2">
      <div>
        <h3 className="font-bold font-heading text-foreground text-lg">Table {order.tableId?.tableNumber || '?'}</h3>
        <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
      </div>
      <div className="flex items-center gap-1.5 text-foreground/80 bg-foreground/5 border border-border/20 px-2.5 py-1 rounded-lg text-xs font-semibold">
        <Clock size={12} />
        {formatTimeAgo(order.createdAt)}
      </div>
    </div>
    
    <div className="flex-1 space-y-2 mb-4">
      {order.items.map((item, idx) => (
        <div key={idx} className="flex flex-col text-sm">
          <div className="flex justify-between w-full text-foreground/90">
            <div className="flex gap-2">
              <span className="font-bold text-foreground">{item.quantity}x</span>
              <span className="font-medium">{item.name}</span>
            </div>
          </div>
          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
            <p className="text-xs text-muted-foreground ml-6">
              + {item.selectedModifiers.map(m => `${m.name}: ${m.option}`).join(', ')}
            </p>
          )}
          {item.instructions && (
            <p className="text-xs text-destructive bg-destructive/5 border border-destructive/10 rounded-md px-2 py-1 mt-1 ml-6 max-w-full break-words">
              Note: {item.instructions}
            </p>
          )}
        </div>
      ))}
    </div>

    <div className="mt-auto flex gap-2">
      {order.status === 'pending' && (
        <Button onClick={() => updateStatus(order._id, 'accepted')} className="flex-1 font-semibold">
          Accept
        </Button>
      )}
      {order.status === 'accepted' && (
        <Button onClick={() => updateStatus(order._id, 'preparing')} className="flex-1 font-semibold">
          Start Cooking
        </Button>
      )}
      {order.status === 'preparing' && (
        <Button onClick={() => updateStatus(order._id, 'ready')} className="flex-1 font-semibold">
          Mark Ready
        </Button>
      )}
      {order.status === 'ready' && (
        <Button onClick={() => updateStatus(order._id, 'served')} variant="outline" className="flex-1 font-semibold">
          Mark Served
        </Button>
      )}
    </div>
  </Card>
);

const KitchenDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0, today: 0 });

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/alert.mp3');
    audioRef.current.loop = true;
  }, []);

  const unlockAudio = () => {
    try {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsAudioUnlocked(true);
        }).catch(e => {
          console.log('Audio unlock failed', e);
        });
      }
    } catch (e) {
      console.log('Audio unlock error', e);
    }
  };

  // Play the alert sound
  const playChime = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => {
          setIsAudioUnlocked(true);
        }).catch(e => {
          console.log('Audio playback blocked or failed', e);
        });
      }
    } catch (e) {
      console.log('Audio playback failed', e);
    }
  };

  const stopChime = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Socket logic
  useSocket({ type: 'restaurant', id: user?.restaurantId }, {
    'new-order': (newOrder) => {
      playChime();
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
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    
    // Auto-stop chime if there are no pending orders (e.g. accepted from another device)
    if (pendingCount === 0) {
      stopChime();
    }

    setStats({
      pending: pendingCount,
      preparing: orders.filter(o => o.status === 'preparing' || o.status === 'accepted').length,
      ready: orders.filter(o => o.status === 'ready').length,
      today: orders.length // Simplification
    });
  }, [orders]);

  const updateStatus = async (orderId, status) => {
    if (status === 'accepted') {
      stopChime();
    }
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
      {/* Background blobs for premium glassmorphism */}
      <div className="bg-blobs">
        <div className="bg-blob-1"></div>
        <div className="bg-blob-2"></div>
        <div className="bg-blob-3"></div>
      </div>

      {/* Main content, relative & z-10 so it overlays the blobs */}
      <div className="relative z-10 flex flex-col flex-1 h-screen overflow-hidden">
        {/* Header */}
        <header className="border-b border-border/20 bg-card/40 backdrop-blur-md px-6 py-4 flex justify-between items-center shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <ChefHat className="text-foreground" size={28} />
            <h1 className="text-xl font-bold font-heading tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/55">
              Kitchen Display System
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2 text-xs font-semibold">
              <div className="glass border border-border/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <span className="text-muted-foreground">Pending</span>
                <span className="bg-foreground text-background font-bold px-1.5 py-0.5 rounded-md text-[10px] min-w-4 text-center">
                  {stats.pending}
                </span>
              </div>
              <div className="glass border border-border/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <span className="text-muted-foreground">Preparing</span>
                <span className="bg-foreground text-background font-bold px-1.5 py-0.5 rounded-md text-[10px] min-w-4 text-center">
                  {stats.preparing}
                </span>
              </div>
              <div className="glass border border-border/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <span className="text-muted-foreground">Ready</span>
                <span className="bg-foreground text-background font-bold px-1.5 py-0.5 rounded-md text-[10px] min-w-4 text-center">
                  {stats.ready}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={unlockAudio}
              className={`font-semibold flex items-center gap-2 transition-all duration-300 ${
                isAudioUnlocked 
                  ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10' 
                  : 'border-amber-500/20 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 animate-pulse'
              }`}
            >
              {isAudioUnlocked ? (
                <>
                  <Volume2 size={16} />
                  <span>Sound Active</span>
                </>
              ) : (
                <>
                  <VolumeX size={16} />
                  <span>Enable Audio Alerts</span>
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={logout} className="font-heading hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all duration-300">
              Logout
            </Button>
          </div>
        </header>

        {/* Kanban Board */}
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden h-[calc(100vh-73px)]">
          
          {/* Pending Column */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="glass border border-border/20 rounded-2xl p-4 mb-3 flex justify-between items-center shadow-md">
              <h2 className="font-bold font-heading text-foreground flex items-center gap-2">
                <Bell size={18} className="text-foreground/80 animate-pulse" /> Pending
              </h2>
              <span className="bg-foreground text-background px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                {stats.pending}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-3 scrollbar-thin scrollbar-thumb-border">
              {orders.filter(o => o.status === 'pending').map(order => (
                <OrderCard key={order._id} order={order} updateStatus={updateStatus} />
              ))}
            </div>
          </div>

          {/* Accepted/Preparing Column */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="glass border border-border/20 rounded-2xl p-4 mb-3 flex justify-between items-center shadow-md">
              <h2 className="font-bold font-heading text-foreground flex items-center gap-2">
                <ChefHat size={18} className="text-foreground/80" /> Preparing
              </h2>
              <span className="bg-foreground text-background px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                {stats.preparing}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-3 scrollbar-thin scrollbar-thumb-border">
              {orders.filter(o => o.status === 'accepted' || o.status === 'preparing').map(order => (
                <OrderCard key={order._id} order={order} updateStatus={updateStatus} />
              ))}
            </div>
          </div>

          {/* Ready Column */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="glass border border-border/20 rounded-2xl p-4 mb-3 flex justify-between items-center shadow-md">
              <h2 className="font-bold font-heading text-foreground flex items-center gap-2">
                <CheckCircle size={18} className="text-foreground/80" /> Ready
              </h2>
              <span className="bg-foreground text-background px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                {stats.ready}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-3 scrollbar-thin scrollbar-thumb-border">
              {orders.filter(o => o.status === 'ready').map(order => (
                <OrderCard key={order._id} order={order} updateStatus={updateStatus} />
              ))}
            </div>
          </div>

          {/* Served Column (Recent) */}
          <div className="flex flex-col h-full opacity-65 overflow-hidden">
            <div className="glass border border-border/20 rounded-2xl p-4 mb-3 flex justify-between items-center shadow-md">
              <h2 className="font-bold font-heading text-foreground/70 flex items-center gap-2">
                <User size={18} className="text-foreground/50" /> Served
              </h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border/20 rounded-2xl text-muted-foreground p-8 text-center bg-card/10 backdrop-blur-sm">
              <CheckCircle size={40} className="mb-3 text-muted-foreground/45" />
              <p className="text-sm font-medium">Orders disappear once marked as served to keep the dashboard clean.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default KitchenDashboard;
