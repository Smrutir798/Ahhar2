import React, { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Utensils, TableProperties, CheckCircle, TrendingUp } from 'lucide-react';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalTables: 0,
    activeTables: 0,
    totalMenuItems: 0,
    todaysOrders: 12 // Dummy data as requested
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [tablesRes, menuRes] = await Promise.all([
          axios.get('/tables'),
          axios.get('/menu')
        ]);
        
        const tables = tablesRes.data;
        setStats({
          totalTables: tables.length,
          activeTables: tables.filter(t => t.status === 'occupied').length,
          totalMenuItems: menuRes.data.length,
          todaysOrders: Math.floor(Math.random() * 20) + 5 // Random dummy data
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            <TableProperties className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTables}</div>
            <p className="text-xs text-muted-foreground">Managed tables in restaurant</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTables}</div>
            <p className="text-xs text-muted-foreground">Currently occupied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
            <Utensils className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMenuItems}</div>
            <p className="text-xs text-muted-foreground">Total dishes on the menu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaysOrders}</div>
            <p className="text-xs text-muted-foreground">Estimated daily order count</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
