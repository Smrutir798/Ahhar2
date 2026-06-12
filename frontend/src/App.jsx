import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ThinkDifferentLogin from './pages/ThinkDifferentLogin';
import DashboardLayout from './pages/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Tables from './pages/Tables';
import Categories from './pages/Categories';
import Menu from './pages/Menu';
import RestaurantProfile from './pages/RestaurantProfile';

import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerMenu from './pages/customer/CustomerMenu';
import CustomerCart from './pages/customer/CustomerCart';
import CustomerOrders from './pages/customer/CustomerOrders';
import BillingDashboard from './pages/admin/BillingDashboard';
import RevenueDashboard from './pages/admin/RevenueDashboard';
import ServiceAnalytics from './pages/admin/ServiceAnalytics';
import Settings from './pages/admin/Settings';
import KitchenDashboard from './pages/kitchen/KitchenDashboard';
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import InventoryDashboard from './pages/admin/InventoryDashboard';
import SupplierDashboard from './pages/admin/SupplierDashboard';
import PurchaseOrders from './pages/admin/PurchaseOrders';
import RecipeManager from './pages/admin/RecipeManager';
import InventoryAnalytics from './pages/admin/InventoryAnalytics';
import ExecutiveDashboard from './pages/admin/ExecutiveDashboard';
import StaffAnalytics from './pages/admin/StaffAnalytics';
import ThinkDifferentDashboard from './pages/admin/ThinkDifferentDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'kitchen') return <Navigate to="/kitchen" />;
    if (user.role === 'thinkdifferent') return <Navigate to="/thinkdifferent" />;
    if (user.role === 'waiter') return <Navigate to="/waiter" />;
    
    // Prevent infinite redirect loops by displaying an error message instead of redirecting to '/'
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground flex-col gap-4">
        <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
        <p>Your role ({user.role}) does not have permission to access this page.</p>
      </div>
    );
  }
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/thinkdifferent-login" element={<ThinkDifferentLogin />} />
        
        {/* Customer Facing Routes */}
        <Route path="/menu/table/:tableId" element={<CustomerLayout />}>
          <Route index element={<CustomerMenu />} />
          <Route path="cart" element={<CustomerCart />} />
          <Route path="history" element={<CustomerOrders />} />
        </Route>

        {/* ThinkDifferent Dashboard */}
        <Route path="/thinkdifferent" element={
          <ProtectedRoute allowedRoles={['thinkdifferent']}>
            <ThinkDifferentDashboard />
          </ProtectedRoute>
        } />

        {/* Kitchen Dashboard */}
        <Route path="/kitchen" element={
          <ProtectedRoute allowedRoles={['kitchen', 'admin', 'owner']}>
            <KitchenDashboard />
          </ProtectedRoute>
        } />

        {/* Admin Dashboard */}
        {/* Waiter Dashboard */}
        <Route path="/waiter" element={<ProtectedRoute allowedRoles={['admin', 'owner', 'waiter']}><WaiterDashboard /></ProtectedRoute>} />

        <Route path="/" element={
          <ProtectedRoute allowedRoles={['admin', 'owner', 'cashier', 'waiter', 'inventory_manager']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="restaurant-profile" element={<RestaurantProfile />} />
          <Route path="tables" element={<Tables />} />
          <Route path="categories" element={<Categories />} />
          <Route path="menu" element={<Menu />} />
          <Route path="billing" element={<BillingDashboard />} />
          <Route path="analytics" element={<RevenueDashboard />} />
          <Route path="service-analytics" element={<ServiceAnalytics />} />
          <Route path="staff-analytics" element={<StaffAnalytics />} />
          <Route path="waiter-ops" element={<WaiterDashboard />} />
          <Route path="profile" element={<Settings />} />
          <Route path="executive-dashboard" element={<ExecutiveDashboard />} />
          
          {/* Inventory / ERP Routes */}
          <Route path="inventory" element={<InventoryDashboard />} />
          <Route path="suppliers" element={<SupplierDashboard />} />
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="recipes" element={<RecipeManager />} />
          <Route path="inventory-analytics" element={<InventoryAnalytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
