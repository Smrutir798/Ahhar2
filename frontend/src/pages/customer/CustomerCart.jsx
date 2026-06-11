import React, { useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '@/lib/axios';
import { CartContext } from '../../context/CartContext';
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CustomerCart = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart, session } = useContext(CartContext);
  const [isPlacing, setIsPlacing] = useState(false);

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
      navigate(`/menu/table/${tableId}/history`);
    } catch (err) {
      console.error("Failed to place order", err);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col flex-1 bg-white items-center justify-center p-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Trash2 size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-center mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Button 
          className="rounded-full w-full max-w-xs h-12"
          onClick={() => navigate(`/menu/table/${tableId}`)}
        >
          Browse Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Order Summary</h1>
      </div>

      {/* Cart Items */}
      <div className="p-4 flex flex-col gap-3">
        {cart.map((item, index) => (
          <div key={index} className="bg-white p-4 rounded-2xl shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                {item.instructions && (
                  <p className="text-xs text-gray-500 mt-1">Note: {item.instructions}</p>
                )}
              </div>
              <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <button 
                className="text-red-500 text-sm font-medium flex items-center gap-1"
                onClick={() => removeFromCart(index)}
              >
                <Trash2 size={16} /> Remove
              </button>
              
              <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1">
                <button 
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-900"
                  onClick={() => updateQuantity(index, -1)}
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                <button 
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-900"
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
      <div className="mt-4 p-6 bg-white border-t border-b">
        <h3 className="font-bold text-gray-900 mb-4">Bill Details</h3>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Item Total</span>
          <span>₹{cartTotal}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <span>Taxes & Charges</span>
          <span>₹0</span>
        </div>
        <div className="border-t border-dashed my-4"></div>
        <div className="flex justify-between font-bold text-lg text-gray-900">
          <span>To Pay</span>
          <span>₹{cartTotal}</span>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-20 flex justify-center">
        <div className="w-full max-w-md">
          <Button 
            className="w-full h-14 rounded-full text-lg font-bold shadow-lg shadow-primary/20"
            onClick={handlePlaceOrder}
            disabled={isPlacing}
          >
            {isPlacing ? 'Placing Order...' : 'Place Order'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerCart;
