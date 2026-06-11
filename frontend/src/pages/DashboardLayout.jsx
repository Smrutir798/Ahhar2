import React, { useContext, useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, TableProperties, MenuSquare, UtensilsCrossed, Settings, LogOut, Receipt, BarChart3, Activity, BellRing, PackageSearch, Truck, ClipboardList, ChefHat, CheckSquare, QrCode, TrendingUp, Package } from 'lucide-react';
import axios from '@/lib/axios';
import ServiceNotifications from '../components/ServiceNotifications';

const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [restaurantName, setRestaurantName] = useState('My Restaurant');

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await axios.get('/restaurant');
        if (res.data && res.data.name) {
          setRestaurantName(res.data.name);
        }
      } catch (err) {
        console.error("Failed to fetch restaurant details");
      }
    };
    fetchRestaurant();
  }, []);

  const navItems = [
    { name: 'Executive Dashboard', path: '/executive-dashboard', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['admin', 'owner'] },
    { name: 'Menu Management', path: '/menu', icon: <UtensilsCrossed className="h-5 w-5" />, roles: ['admin', 'owner'] },
    { name: 'Table Management', path: '/tables', icon: <CheckSquare className="h-5 w-5" />, roles: ['admin', 'owner'] },
    { name: 'Billing & Payments', path: '/billing', icon: <Receipt className="h-5 w-5" />, roles: ['admin', 'owner', 'cashier'] },
    
    // BI & Analytics
    { name: 'Sales & Revenue BI', path: '/analytics', icon: <TrendingUp className="h-5 w-5" />, roles: ['admin', 'owner'] },
    { name: 'Customer Feedback BI', path: '/service-analytics', icon: <BarChart3 className="h-5 w-5" />, roles: ['admin', 'owner'] },
    { name: 'Staff Performance BI', path: '/staff-analytics', icon: <Users className="h-5 w-5" />, roles: ['admin', 'owner'] },
    
    // Kitchen & Waiter
    { name: 'Waitstaff Ops', path: '/waiter-ops', icon: <Users className="h-5 w-5" />, roles: ['admin', 'owner', 'waiter'] },
    { name: 'Kitchen Ops', path: '/kitchen', icon: <Users className="h-5 w-5" />, roles: ['admin', 'owner'] },
    
    // ERP & Inventory
    { name: 'Inventory Master', path: '/inventory', icon: <Package className="h-5 w-5" />, roles: ['admin', 'owner', 'inventory_manager'] },
    { name: 'Suppliers', path: '/suppliers', icon: <Truck className="h-5 w-5" />, roles: ['admin', 'owner', 'inventory_manager'] },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: <ClipboardList className="h-5 w-5" />, roles: ['admin', 'owner', 'inventory_manager'] },
    { name: 'Recipe Maps', path: '/recipes', icon: <ChefHat className="h-5 w-5" />, roles: ['admin', 'owner', 'inventory_manager'] },
    { name: 'Stock Analytics', path: '/inventory-analytics', icon: <BarChart3 className="h-5 w-5" />, roles: ['admin', 'owner', 'inventory_manager'] },
    { name: 'Categories', path: '/categories', icon: <MenuSquare className="h-5 w-5" />, roles: ['admin', 'owner'] },
    { name: 'Settings', path: '/profile', icon: <Settings className="h-5 w-5" />, roles: ['admin', 'owner'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-background to-muted/50">
      <aside className="hidden w-64 flex-col border-r bg-background/80 backdrop-blur-xl sm:flex z-10 animate-fade-in shadow-lg">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold font-heading text-xl text-primary transition-transform hover:scale-105 active:scale-95">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">{restaurantName}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 hover:text-primary hover:bg-primary/10 hover:translate-x-1 ${
                  location.pathname === item.path ? 'bg-primary/15 text-primary font-semibold shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-white/5">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-destructive hover:bg-destructive/10 hover:translate-x-1"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-background/60 backdrop-blur-md px-4 lg:h-[60px] lg:px-6 justify-between sm:justify-end sticky top-0 z-10 shadow-sm transition-all duration-300">
          <div className="sm:hidden font-bold font-heading text-lg text-primary">{restaurantName}</div>
          <div className="flex items-center gap-4">
            <ServiceNotifications />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-sm font-medium group-hover:text-primary transition-colors">{user?.name}</div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
