import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  // Ensure headers object exists
  if (!config.headers) {
    config.headers = {};
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[Axios] Token attached:', token.substring(0, 20) + '...');
  } else {
    console.warn('[Axios] No token found in localStorage');
  }
  
  return config;
}, (error) => {
  console.error('[Axios] Request interceptor error:', error);
  return Promise.reject(error);
});

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[Axios] 401 Unauthorized - clearing auth');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
