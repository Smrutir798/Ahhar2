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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/50">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-1 font-sans">Real-time overview of your restaurant's performance</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none" onClick={() => handleExport('revenue')}><Download size={16} className="mr-2" /> Export Revenue</Button>
          <Button variant="outline" className="flex-1 md:flex-none" onClick={() => handleExport('orders')}><Download size={16} className="mr-2" /> Export Orders</Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card 
          style={{ background: '#EAF3DE', border: '0.5px solid #C0DD97' }}
          className="p-4 flex flex-col justify-between transition-all duration-300 hover:opacity-90"
        >
          <div className="text-[#3B6D11] text-sm flex items-center"><IndianRupee size={14} className="mr-1" /> Today's Revenue</div>
          <div className="text-2xl font-bold font-heading mt-2 text-[#27500A]">₹{data?.todaysRevenue || 0}</div>
        </Card>
        <Card 
          style={{ background: '#EAF3DE', border: '0.5px solid #C0DD97' }}
          className="p-4 flex flex-col justify-between transition-all duration-300 hover:opacity-90"
        >
          <div className="text-[#3B6D11] text-sm flex items-center"><TrendingUp size={14} className="mr-1" /> Monthly Rev.</div>
          <div className="text-2xl font-bold font-heading mt-2 text-[#27500A]">₹{data?.monthlyRevenue || 0}</div>
        </Card>
        <Card 
          style={{ background: '#EAF3DE', border: '0.5px solid #C0DD97' }}
          className="p-4 flex flex-col justify-between transition-all duration-300 hover:opacity-90"
        >
          <div className="text-[#3B6D11] text-sm flex items-center"><IndianRupee size={14} className="mr-1" /> Est. Profit</div>
          <div className="text-2xl font-bold font-heading mt-2 text-[#27500A]">₹{profit?.profit || 0}</div>
        </Card>
        <Card 
          style={{ background: '#E6F1FB', border: '0.5px solid #B5D4F4' }}
          className="p-4 flex flex-col justify-between transition-all duration-300 hover:opacity-90"
        >
          <div className="text-[#185FA5] text-sm flex items-center"><ShoppingBag size={14} className="mr-1" /> Orders Today</div>
          <div className="text-2xl font-bold font-heading mt-2 text-[#0C447C]">{data?.todayOrders || 0}</div>
        </Card>
        <Card 
          style={{ background: '#E6F1FB', border: '0.5px solid #B5D4F4' }}
          className="p-4 flex flex-col justify-between transition-all duration-300 hover:opacity-90"
        >
          <div className="text-[#185FA5] text-sm flex items-center"><IndianRupee size={14} className="mr-1" /> Avg Order</div>
          <div className="text-2xl font-bold font-heading mt-2 text-[#0C447C]">₹{data?.avgOrderValue || 0}</div>
        </Card>
        <Card 
          style={{ background: '#FAEEDA', border: '0.5px solid #FAC775' }}
          className="p-4 flex flex-col justify-between transition-all duration-300 hover:opacity-90"
        >
          <div className="text-[#854F0B] text-sm flex items-center"><Users size={14} className="mr-1" /> Rating</div>
          <div className="text-2xl font-bold font-heading mt-2 text-[#633806]">★ {data?.rating || '0.0'}</div>
        </Card>
      </div>

      {/* AI Insights Engine */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center font-heading">
          <TrendingUp size={20} className="mr-2 text-foreground" /> AI Business Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, idx) => (
            <div 
              key={idx} 
              style={{ background: '#EEEDFE', border: '0.5px solid #CECBF6' }}
              className="p-4 rounded-xl flex items-start gap-3 transition-all duration-300 hover:opacity-90"
            >
              <AlertTriangle className="text-[#534AB7] mt-0.5 flex-shrink-0" size={16} />
              <p className="text-sm font-medium font-sans text-[#3C3489]">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Profit Breakdown */}
      <Card 
        style={{ background: '#EAF3DE', border: '0.5px solid #C0DD97' }}
        className="mt-8 p-6 transition-all duration-300 hover:opacity-95"
      >
        <h2 className="text-xl font-bold font-heading mb-4 text-[#27500A]">Financial Health (All Time)</h2>
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#C0DD97]/60 pt-4 font-sans">
          <div className="text-center w-full mb-4 md:mb-0">
            <p className="text-[#3B6D11] text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-[#27500A]">₹{profit?.revenue || 0}</p>
          </div>
          <div className="text-2xl font-light text-[#3B6D11]/30 hidden md:block">-</div>
          <div className="text-center w-full mb-4 md:mb-0">
            <p className="text-[#854F0B] text-sm">Inventory & Waste Cost</p>
            <p className="text-2xl font-bold text-[#854F0B]">₹{profit?.cost || 0}</p>
          </div>
          <div className="text-2xl font-light text-[#3B6D11]/30 hidden md:block">=</div>
          <div className="text-center w-full">
            <p className="text-[#3B6D11] text-sm font-semibold">Estimated Profit</p>
            <p className="text-3xl font-bold text-[#27500A] font-heading">₹{profit?.profit || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExecutiveDashboard;
