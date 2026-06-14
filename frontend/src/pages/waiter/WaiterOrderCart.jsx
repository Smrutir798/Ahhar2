import React, { useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '@/lib/axios';
import { CartContext } from '../../context/CartContext';
import { ArrowLeft, Trash2, Plus, Minus, WifiOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const WaiterOrderCart = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart, session } = useContext(CartContext);
  const [isPlacing, setIsPlacing] = useState(false);
  const isOnline = useNetworkStatus();

  const handlePlaceOrder = async () => {
    if (!session || cart.length === 0) return;
    
    setIsPlacing(true);
    try {
      await axios.post('/customer/orders', {
        sessionId: session._id,
        tableId: session.tableId,
        restaurantId: session.restaurantId,
        items: cart,
        totalAmount: cartTotal
      });
      
      clearCart();
      // Waiter flow: Return to the tables view after placing an order
      navigate('/waiter/order');
    } catch (err) {
      console.error("Failed to place order", err);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col flex-1 bg-transparent items-center justify-center p-6 text-foreground animate-fade-in">
        <div className="w-24 h-24 bg-foreground/5 border border-border rounded-full flex items-center justify-center mb-6">
          <Trash2 size={32} className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground font-heading mb-2">Cart is empty</h2>
        <p className="text-muted-foreground text-center mb-8 font-sans">No items selected for this table.</p>
        <Button 
          className="rounded-full w-full max-w-xs h-12 shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => navigate(`/waiter/order/${tableId}`)}
        >
          Return to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-transparent pb-32 text-foreground">
      {/* Header */}
      <div className="bg-card/40 backdrop-blur-xl border-b border-border/40 px-4 py-4 sticky top-0 z-10 shadow-lg flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-foreground/5 active:scale-95 transition-all text-foreground">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground font-heading">Order Summary</h1>
          <p className="text-xs font-bold text-primary">Table {session?.tableId?.tableNumber || "Selected"}</p>
        </div>
      </div>

      {!isOnline && (
        <div className="bg-destructive text-destructive-foreground px-4 py-3 flex items-center gap-2 justify-center text-sm font-medium">
          <WifiOff size={16} />
          You are offline. Please reconnect to place order.
        </div>
      )}

      {/* Cart Items */}
      <div className="p-4 flex flex-col gap-3">
        {cart.map((item, index) => (
          <div key={index} className="bg-card/30 border border-border p-4 rounded-2xl shadow-sm flex flex-col hover:border-primary/25 transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-foreground font-heading text-base">{item.name}</h3>
                {item.instructions && (
                  <p className="text-xs text-muted-foreground mt-1 font-sans font-medium text-amber-600">Note: {item.instructions}</p>
                )}
                {item.selectedModifiers && item.selectedModifiers.map((mod, i) => (
                  <p key={i} className="text-xs text-muted-foreground font-sans">• {mod.option} {mod.price > 0 ? `(+₹${mod.price})` : ''}</p>
                ))}
              </div>
              <span className="font-bold text-foreground font-heading text-lg">₹{item.price * item.quantity}</span>
            </div>
            
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/40">
              <button 
                className="text-destructive hover:text-destructive/80 active:scale-95 text-sm font-medium flex items-center gap-1 transition-all"
                onClick={() => removeFromCart(index)}
              >
                <Trash2 size={16} /> Remove
              </button>
              
              <div className="flex items-center gap-3 bg-foreground/5 rounded-full p-1 border border-border">
                <button 
                  className="w-8 h-8 bg-background hover:bg-foreground/10 active:scale-95 rounded-full flex items-center justify-center shadow-sm text-foreground border border-border transition-all"
                  onClick={() => updateQuantity(index, -1)}
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-sm w-4 text-center text-foreground">{item.quantity}</span>
                <button 
                  className="w-8 h-8 bg-background hover:bg-foreground/10 active:scale-95 rounded-full flex items-center justify-center shadow-sm text-foreground border border-border transition-all"
                  onClick={() => updateQuantity(index, 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bill Summary */}
      <div className="mt-2 p-6 bg-primary/5 border border-primary/20 rounded-2xl m-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-4 -mt-4"></div>
        <h3 className="font-bold text-foreground font-heading mb-4 relative z-10">Bill Details</h3>
        <div className="flex justify-between text-sm text-muted-foreground mb-2 relative z-10">
          <span className="font-medium">Item Total</span>
          <span className="font-bold text-foreground">₹{cartTotal}</span>
        </div>
        <div className="border-t border-dashed border-primary/20 my-4 relative z-10"></div>
        <div className="flex justify-between font-bold text-lg text-foreground font-heading relative z-10">
          <span>To Pay</span>
          <span className="text-2xl text-primary">₹{cartTotal}</span>
        </div>
      </div>

      {/* Checkout Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border z-20 pb-safe">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="font-bold text-foreground font-heading">Total Amount</span>
          <span className="text-3xl font-black text-primary font-heading">₹{cartTotal}</span>
        </div>
        <Button 
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handlePlaceOrder}
          disabled={isPlacing || !isOnline}
        >
          {isPlacing ? 'Sending to Kitchen...' : (
            <>
              <CheckCircle size={20} /> Place Order to Kitchen
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default WaiterOrderCart;
