import React, { useContext, useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, TableProperties, Menu, X, Utensils, Settings, LogOut, Receipt, BarChart, Activity, BellRing, Search, Truck, ClipboardList, ChefHat, Check, QrCode, TrendingUp, Package, Printer, CreditCard } from 'lucide-react';
import axios from '@/lib/axios';
import ServiceNotifications from '../components/ServiceNotifications';

const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [restaurantName, setRestaurantName] = useState('My Restaurant');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [activePlan, setActivePlan] = useState('free');

  useEffect(() => {
    const fetchRestaurantAndPlan = async () => {
      try {
        const res = await axios.get('/restaurant');
        if (res.data && res.data.name) {
          setRestaurantName(res.data.name);
        }
        
        const planRes = await axios.get('/subscriptions/plans');
        if (planRes.data && planRes.data.success) {
          setActivePlan(planRes.data.activePlan || 'free');
        }
      } catch (err) {
        console.error("[DashboardLayout] Failed to fetch details:", err.message);
      }
    };
    fetchRestaurantAndPlan();

    const handleUpdate = (e) => {
      if (e.detail && e.detail.name) {
        setRestaurantName(e.detail.name);
      }
    };
    window.addEventListener('restaurant-updated', handleUpdate);
    return () => window.removeEventListener('restaurant-updated', handleUpdate);
  }, []);

  const navItems = [
    { name: 'Executive Dashboard', path: '/executive-dashboard', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['admin', 'owner'], plans: ['basic', 'standard', 'premium', 'free'] },
    { name: 'Menu Management', path: '/menu', icon: <Utensils className="h-5 w-5" />, roles: ['admin', 'owner'], plans: ['basic', 'standard', 'premium', 'free'] },
    { name: 'Table Management', path: '/tables', icon: <Check className="h-5 w-5" />, roles: ['admin', 'owner'], plans: ['basic', 'standard', 'premium', 'free'] },
    { name: 'Staff Management', path: '/staff', icon: <Users className="h-5 w-5" />, roles: ['admin', 'owner'], plans: ['basic', 'standard', 'premium', 'free'] },
    { name: 'Billing & Payments', path: '/billing', icon: <Receipt className="h-5 w-5" />, roles: ['admin', 'owner', 'cashier'], plans: ['basic', 'standard', 'premium', 'free'] },
    
    // BI & Analytics
    { name: 'Revenue Analytics', path: '/analytics', icon: <BarChart className="h-5 w-5" />, roles: ['admin', 'owner'], plans: ['standard', 'premium'] },
    { name: 'Customer Feedback BI', path: '/service-analytics', icon: <BarChart className="h-5 w-5" />, roles: ['admin', 'owner'], plans: ['standard', 'premium'] },
    { name: 'Staff Performance BI', path: '/staff-analytics', icon: <Users className="h-5 w-5" />, roles: ['admin', 'owner'], plans: ['standard', 'premium'] },
    
    // Kitchen & Waiter
    { name: 'Waitstaff Ops', path: '/waiter-ops', icon: <Users className="h-5 w-5" />, roles: ['admin', 'owner', 'waiter'], plans: ['basic', 'standard', 'premium', 'free'] },
    { name: 'Kitchen Ops', path: '/kitchen', icon: <Users className="h-5 w-5" />, roles: ['admin', 'owner'], plans: ['basic', 'standard', 'premium', 'free'] },
    
    // ERP & Inventory
    { name: 'Inventory Master', path: '/inventory', icon: <Package className="h-5 w-5" />, roles: ['admin', 'owner', 'inventory_manager'], plans: ['standard', 'premium'] },
    { name: 'Suppliers', path: '/suppliers', icon: <Truck className="h-5 w-5" />, roles: ['admin', 'owner', 'inventory_manager'], plans: ['standard', 'premium'] },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: <ClipboardList className="h-5 w-5" />, roles: ['admin', 'owner', 'inventory_manager'], plans: ['standard', 'premium'] },
    { name: 'Recipe Maps', path: '/recipes', icon: <ChefHat className="h-5 w-5" />, roles: ['admin', 'owner', 'inventory_manager'], plans: ['standard', 'premium'] },
    { name: 'Inventory Analytics', path: '/inventory-analytics', icon: <Search className="h-5 w-5" />, roles: ['admin', 'owner', 'inventory_manager'], plans: ['standard', 'premium'] },
    { name: 'Categories', path: '/categories', icon: <Menu className="h-5 w-5" />, roles: ['admin', 'owner'], plans: ['basic', 'standard', 'premium', 'free'] },
    { name: 'Settings', path: '/profile', icon: <Settings className="h-5 w-5" />, roles: ['admin', 'owner'], plans: ['basic', 'standard', 'premium', 'free'] },
  ];

  const roleFilteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 sm:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-border bg-background transform transition-transform duration-300 ease-in-out sm:relative sm:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[60px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 font-bold font-heading text-xl text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground text-background text-sm font-bold">
              {restaurantName.charAt(0).toUpperCase()}
            </div>
            <span>{restaurantName}</span>
          </Link>
          <button 
            className="sm:hidden text-muted-foreground hover:text-foreground" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-auto py-4 hide-scrollbar">
          <nav className="grid items-start px-4 text-sm font-medium gap-1.5">
            {roleFilteredNavItems.map((item) => {
              const isLocked = item.plans && !item.plans.includes(activePlan);

              return (
                <Link
                  key={item.name}
                  to={isLocked ? '#' : item.path}
                  onClick={(e) => {
                    if (isLocked) e.preventDefault();
                    else setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200 ${
                    location.pathname === item.path && !isLocked
                      ? 'bg-foreground text-background font-semibold' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground' : ''}`}
                >
                  {item.icon}
                  <span className="flex-1">{item.name}</span>
                  {isLocked && <div className="ml-auto flex items-center justify-center text-gray-400" title="Feature locked on current plan">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">{user?.name || 'User'}</span>
              <span className="text-xs text-muted-foreground uppercase">{user?.role || 'Role'}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-foreground/5"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
      
      <div className="flex flex-col flex-1 overflow-hidden bg-[#fafafa]">
        <header className="flex h-[60px] items-center justify-between border-b border-border bg-background px-6 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="sm:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden sm:flex items-center text-sm text-muted-foreground">
              {restaurantName} <span className="mx-2">/</span> <span className="font-medium text-foreground">{navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end">
            <ServiceNotifications />
            <div className="hidden sm:flex items-center gap-2 border border-border rounded-full px-3 py-1 bg-background text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-[#4ade80]"></span>
              System Active
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 md:p-8 hide-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
