import React, { createContext, useState, useEffect } from 'react';
import axios from '@/lib/axios';
import useSocket from '../hooks/useSocket';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    if (!savedCart || savedCart === 'undefined') return [];
    try {
      return JSON.parse(savedCart);
    } catch (e) {
      localStorage.removeItem('cart');
      return [];
    }
  });
  
  const [session, setSession] = useState(() => {
    const savedSession = localStorage.getItem('session');
    if (!savedSession || savedSession === 'undefined') return null;
    try {
      return JSON.parse(savedSession);
    } catch (e) {
      localStorage.removeItem('session');
      return null;
    }
  });

  // Connect cart updates via socket room
  useSocket(
    session?._id ? { type: 'session', id: session._id } : null,
    {
      'cart-updated': (updatedCart) => {
        setCart(updatedCart || []);
      },
      'session-closed': () => {
        setCart([]);
        setSession(null);
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

  const syncCart = async (newCart) => {
    if (session?._id) {
      try {
        await axios.put(`/customer/session/${session._id}/cart`, { cart: newCart });
      } catch (err) {
        console.error('Failed to sync cart with server', err);
      }
    }
  };

  const addToCart = (item, quantity = 1, instructions = '', selectedModifiers = []) => {
    setCart(prev => {
      const existingItemIndex = prev.findIndex(i => {
        const isSameItem = i.menuItemId === item._id && i.instructions === instructions;
        if (!isSameItem) return false;
        
        const aMods = i.selectedModifiers || [];
        const bMods = selectedModifiers || [];
        if (aMods.length !== bMods.length) return false;
        
        return aMods.every(am => bMods.some(bm => bm.name === am.name && bm.option === am.option));
      });

      let newCart;
      if (existingItemIndex > -1) {
        newCart = [...prev];
        newCart[existingItemIndex].quantity += quantity;
      } else {
        newCart = [...prev, {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity,
          instructions,
          selectedModifiers
        }];
      }
      syncCart(newCart);
      return newCart;
    });
  };

  const removeFromCart = (index) => {
    setCart(prev => {
      const newCart = prev.filter((_, i) => i !== index);
      syncCart(newCart);
      return newCart;
    });
  };

  const updateQuantity = (index, delta) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[index].quantity += delta;
      const filteredCart = newCart[index].quantity <= 0 
        ? newCart.filter((_, i) => i !== index) 
        : newCart;
      syncCart(filteredCart);
      return filteredCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    syncCart([]);
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
