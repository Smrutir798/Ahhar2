import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Download, TrendingUp, DollarSign, ShoppingBag, Users, Clock, AlertTriangle, IndianRupee } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const ExecutiveDashboard = () => {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [profit, setProfit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [execRes, insightsRes, profitRes] = await Promise.all([
        axios.get('/analytics/executive', { headers }),
        axios.get('/analytics/insights', { headers }),
        axios.get('/analytics/profit', { headers })
      ]);
      
      setData(execRes.data);
      setInsights(insightsRes.data);
      setProfit(profitRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/reports/csv?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(`Failed to export ${type} report`);
    }
  };

  if (loading) return <div className="p-8">Loading Executive Dashboard...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-foreground">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/50">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-1 font-sans">Real-time overview of your restaurant's performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('revenue')}><Download size={16} className="mr-2" /> Export Revenue</Button>
          <Button variant="outline" onClick={() => handleExport('orders')}><Download size={16} className="mr-2" /> Export Orders</Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 flex flex-col justify-between hover:border-foreground/25 transition-all duration-300">
          <div className="text-muted-foreground text-sm flex items-center"><IndianRupee size={14} className="mr-1" /> Today's Revenue</div>
          <div className="text-2xl font-bold font-heading mt-2">₹{data?.todaysRevenue || 0}</div>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:border-foreground/25 transition-all duration-300">
          <div className="text-muted-foreground text-sm flex items-center"><TrendingUp size={14} className="mr-1" /> Monthly Rev.</div>
          <div className="text-2xl font-bold font-heading mt-2">₹{data?.monthlyRevenue || 0}</div>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:border-foreground/25 transition-all duration-300">
          <div className="text-muted-foreground text-sm flex items-center"><IndianRupee size={14} className="mr-1" /> Est. Profit</div>
          <div className="text-2xl font-bold font-heading mt-2">₹{profit?.profit || 0}</div>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:border-foreground/25 transition-all duration-300">
          <div className="text-muted-foreground text-sm flex items-center"><ShoppingBag size={14} className="mr-1" /> Orders Today</div>
          <div className="text-2xl font-bold font-heading mt-2">{data?.todayOrders || 0}</div>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:border-foreground/25 transition-all duration-300">
          <div className="text-muted-foreground text-sm flex items-center"><IndianRupee size={14} className="mr-1" /> Avg Order</div>
          <div className="text-2xl font-bold font-heading mt-2">₹{data?.avgOrderValue || 0}</div>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:border-foreground/25 transition-all duration-300">
          <div className="text-muted-foreground text-sm flex items-center"><Users size={14} className="mr-1" /> Rating</div>
          <div className="text-2xl font-bold font-heading mt-2">★ {data?.rating || '0.0'}</div>
        </Card>
      </div>

      {/* AI Insights Engine */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center font-heading">
          <TrendingUp size={20} className="mr-2 text-foreground" /> AI Business Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-border bg-foreground/5 flex items-start gap-3 hover:border-foreground/20 transition-all duration-300">
              <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-sm font-medium font-sans text-foreground">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Profit Breakdown */}
      <Card className="mt-8 p-6 hover:border-foreground/25 transition-all duration-300">
        <h2 className="text-xl font-bold font-heading mb-4">Financial Health (All Time)</h2>
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-border/40 pt-4 font-sans">
          <div className="text-center w-full mb-4 md:mb-0">
            <p className="text-muted-foreground text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground">₹{profit?.revenue || 0}</p>
          </div>
          <div className="text-2xl font-light text-muted-foreground/30 hidden md:block">-</div>
          <div className="text-center w-full mb-4 md:mb-0">
            <p className="text-muted-foreground text-sm">Inventory & Waste Cost</p>
            <p className="text-2xl font-bold text-foreground">₹{profit?.cost || 0}</p>
          </div>
          <div className="text-2xl font-light text-muted-foreground/30 hidden md:block">=</div>
          <div className="text-center w-full">
            <p className="text-muted-foreground text-sm font-semibold">Estimated Profit</p>
            <p className="text-3xl font-bold text-foreground font-heading">₹{profit?.profit || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExecutiveDashboard;
