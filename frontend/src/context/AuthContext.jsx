import React, { createContext, useState, useEffect } from 'react';
import axios from '@/lib/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('[AuthContext] Initializing - token present:', !!token);
    
    if (token && storedUser && storedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Set default header for axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[AuthContext] Restored user from localStorage:', parsedUser);
      } catch (e) {
        console.error('[AuthContext] Failed to parse user from localStorage', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      console.log('[AuthContext] No valid token/user in localStorage');
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    console.log('[AuthContext] Logging in user:', userData);
    
    if (!token) {
      console.error('[AuthContext] No token provided to login!');
      return;
    }
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log('[AuthContext] User logged in, token stored');
  };

  const logout = () => {
    console.log('[AuthContext] Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
