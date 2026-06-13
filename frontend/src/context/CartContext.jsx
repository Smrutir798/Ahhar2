import React, { createContext, useState, useEffect } from 'react';
import axios from '@/lib/axios';
import useSocket from '../hooks/useSocket';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const getUrlTableId = () => {
    const pathParts = window.location.pathname.split('/');
    const tableIndex = pathParts.indexOf('table');
    if (tableIndex !== -1 && pathParts.length > tableIndex + 1) {
      return pathParts[tableIndex + 1];
    }
    return null;
  };

  const [session, setSession] = useState(() => {
    const savedSession = localStorage.getItem('session');
    if (!savedSession || savedSession === 'undefined') return null;
    try {
      const parsed = JSON.parse(savedSession);
      const urlTableId = getUrlTableId();
      // If the session belongs to a different table, discard it immediately to prevent cross-contamination
      if (urlTableId && parsed.tableId !== urlTableId) {
        localStorage.removeItem('session');
        localStorage.removeItem('cart');
        return null;
      }
      return parsed;
    } catch (e) {
      localStorage.removeItem('session');
      return null;
    }
  });

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    const savedSession = localStorage.getItem('session'); // Check if session was cleared
    if (!savedCart || savedCart === 'undefined' || !savedSession) return [];
    try {
      return JSON.parse(savedCart);
    } catch (e) {
      localStorage.removeItem('cart');
      return [];
    }
  });

  // Connect cart updates via socket room
  useSocket(
    session?._id ? { type: 'session', id: session._id } : null,
    {
      'cart-updated': (updatedCart) => {
        setCart(updatedCart || []);
      },
      'session-closed': (bill) => {
        setCart([]);
        setSession(null);
        localStorage.removeItem('cart');
        localStorage.removeItem('session');
        
        let tableId = bill?.tableId;
        if (typeof tableId === 'object') tableId = tableId._id;
        
        if (!tableId) {
          const pathParts = window.location.pathname.split('/');
          const tableIndex = pathParts.indexOf('table');
          if (tableIndex !== -1 && pathParts.length > tableIndex + 1) {
            tableId = pathParts[tableIndex + 1];
          }
        }
        
        if (tableId) {
          const sId = bill?.sessionId || session?._id || '';
          const rId = bill?.restaurantId || session?.restaurantId || '';
          window.location.href = `/menu/table/${tableId}/ended?sessionId=${sId}&restaurantId=${rId}`;
        }
      }
    }
  );

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('session', JSON.stringify(session));
    if (session && session.cart) {
      setCart(session.cart);
    } else if (!session) {
      setCart([]);
    }
  }, [session]);

  const addToCart = async (item, quantity = 1, instructions = '', selectedModifiers = []) => {
    if (!session?._id) return;
    
    // Check if exactly same item is in cart
    const existingItem = cart.find(i => {
      const isSameItem = i.menuItemId === item._id && i.instructions === instructions;
      if (!isSameItem) return false;
      const aMods = i.selectedModifiers || [];
      const bMods = selectedModifiers || [];
      if (aMods.length !== bMods.length) return false;
      return aMods.every(am => bMods.some(bm => bm.name === am.name && bm.option === am.option));
    });

    try {
      if (existingItem) {
        // Atomic update quantity
        const newQuantity = existingItem.quantity + quantity;
        
        // Optimistic UI update
        setCart(prev => prev.map(i => i.cartItemId === existingItem.cartItemId ? { ...i, quantity: newQuantity } : i));
        
        await axios.put(`/customer/session/${session._id}/cart/update`, {
          cartItemId: existingItem.cartItemId,
          quantity: newQuantity
        });
      } else {
        // Atomic add item
        const newItem = {
          cartItemId: crypto.randomUUID(),
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity,
          instructions,
          selectedModifiers
        };
        
        // Optimistic UI update
        setCart(prev => [...prev, newItem]);
        
        await axios.post(`/customer/session/${session._id}/cart/add`, {
          cartItem: newItem
        });
      }
    } catch (err) {
      console.error('Failed to add to cart', err);
    }
  };

  const removeFromCart = async (index) => {
    if (!session?._id) return;
    const item = cart[index];
    if (!item || !item.cartItemId) return;
    
    try {
      // Optimistic UI update
      setCart(prev => prev.filter(i => i.cartItemId !== item.cartItemId));
      
      await axios.delete(`/customer/session/${session._id}/cart/remove/${item.cartItemId}`);
    } catch (err) {
      console.error('Failed to remove from cart', err);
    }
  };

  const updateQuantity = async (index, delta) => {
    if (!session?._id) return;
    const item = cart[index];
    if (!item || !item.cartItemId) return;
    
    const newQuantity = item.quantity + delta;
    try {
      if (newQuantity <= 0) {
        // Optimistic UI update
        setCart(prev => prev.filter(i => i.cartItemId !== item.cartItemId));
        
        await axios.delete(`/customer/session/${session._id}/cart/remove/${item.cartItemId}`);
      } else {
        // Optimistic UI update
        setCart(prev => prev.map(i => i.cartItemId === item.cartItemId ? { ...i, quantity: newQuantity } : i));
        
        await axios.put(`/customer/session/${session._id}/cart/update`, {
          cartItemId: item.cartItemId,
          quantity: newQuantity
        });
      }
    } catch (err) {
      console.error('Failed to update quantity', err);
    }
  };

  const clearCart = async () => {
    if (!session?._id) return;
    try {
      setCart([]);
      await axios.delete(`/customer/session/${session._id}/cart`);
    } catch (err) {
      console.error('Failed to clear cart', err);
    }
  };

  const cartTotal = cart.reduce((total, item) => {
    const modifierCost = item.selectedModifiers ? item.selectedModifiers.reduce((acc, m) => acc + (m.price || 0), 0) : 0;
    return total + ((item.price + modifierCost) * item.quantity);
  }, 0);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount,
      session, setSession
    }}>
      {children}
    </CartContext.Provider>
  );
};
