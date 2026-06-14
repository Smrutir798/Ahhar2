import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { CartProvider } from '../../context/CartContext';
import { ArrowLeft } from 'lucide-react';
import WaiterNotifications from '../../components/WaiterNotifications';

const WaiterOrderLayout = () => {
  const navigate = useNavigate();

  return (
    <CartProvider>
      <div className="min-h-screen bg-background text-foreground flex justify-center items-center p-0 sm:p-4 overflow-hidden relative w-full transition-colors duration-300">
        <WaiterNotifications />
        <div className="bg-blobs">
          <div className="bg-blob-1 opacity-20 bg-blue-500"></div>
          <div className="bg-blob-2 opacity-15 bg-purple-500"></div>
          <div className="bg-blob-3 opacity-10 bg-indigo-500"></div>
        </div>

        <div className="w-full max-w-md bg-card/80 backdrop-blur-2xl sm:border border-border/60 sm:rounded-3xl min-h-screen sm:min-h-[850px] sm:max-h-[90vh] sm:shadow-2xl relative overflow-hidden flex flex-col z-10 transition-colors duration-300">
          <div className="bg-primary/10 border-b border-border p-3 flex items-center justify-between shadow-sm sticky top-0 z-40 backdrop-blur-md">
            <button 
              onClick={() => navigate('/waiter-ops')} 
              className="flex items-center gap-1 text-sm font-bold text-primary active:scale-95 transition-transform"
            >
              <ArrowLeft size={16} /> Exit to Dashboard
            </button>
            <div className="text-xs font-black uppercase tracking-widest text-primary/70">Captain App</div>
          </div>
          
          <div className="hidden sm:flex justify-center w-full absolute top-0 left-0 right-0 z-30 pointer-events-none">
            <div className="w-32 h-4 bg-foreground rounded-b-xl border-x border-b border-border/20 opacity-90"></div>
          </div>
          
          <div className="flex-1 flex flex-col overflow-auto hide-scrollbar">
            <Outlet />
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default WaiterOrderLayout;
