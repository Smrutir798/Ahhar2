import React from 'react';
import { Outlet } from 'react-router-dom';
import { CartProvider } from '../../context/CartContext';

const CustomerLayout = () => {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background text-foreground flex justify-center items-center p-0 sm:p-4 overflow-hidden relative w-full transition-colors duration-300">
        {/* Ambient background blobs for phone preview */}
        <div className="bg-blobs">
          <div className="bg-blob-1 opacity-20"></div>
          <div className="bg-blob-2 opacity-15"></div>
          <div className="bg-blob-3 opacity-10"></div>
        </div>

        {/* Mobile device frame mockup */}
        <div className="w-full max-w-md bg-card/60 backdrop-blur-2xl sm:border border-border/60 sm:rounded-3xl min-h-screen sm:min-h-[850px] sm:max-h-[90vh] sm:shadow-2xl relative overflow-hidden flex flex-col z-10 transition-colors duration-300">
          {/* Top notch style for modern mobile UI look on desktop viewports */}
          <div className="hidden sm:flex justify-center w-full absolute top-0 left-0 right-0 z-30 pointer-events-none">
            <div className="w-32 h-4 bg-foreground rounded-b-xl border-x border-b border-border/20 opacity-90"></div>
          </div>
          <div className="flex-1 flex flex-col overflow-auto hide-scrollbar sm:pt-4">
            <Outlet />
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default CustomerLayout;
