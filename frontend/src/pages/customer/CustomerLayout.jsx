import React from 'react';
import { Outlet } from 'react-router-dom';
import { CartProvider } from '../../context/CartContext';

const CustomerLayout = () => {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50 flex justify-center">
        {/* Mobile max-width container */}
        <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative overflow-hidden flex flex-col">
          <Outlet />
        </div>
      </div>
    </CartProvider>
  );
};

export default CustomerLayout;
