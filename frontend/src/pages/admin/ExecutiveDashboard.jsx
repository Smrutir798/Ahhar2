import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Download, TrendingUp, IndianRupee, ShoppingBag, Users, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-500">Real-time overview of your restaurant's performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('revenue')}><Download size={16} className="mr-2" /> Export Revenue</Button>
          <Button variant="outline" onClick={() => handleExport('orders')}><Download size={16} className="mr-2" /> Export Orders</Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="text-gray-500 text-sm flex items-center"><IndianRupee size={14} className="mr-1" /> Today's Revenue</div>
          <div className="text-2xl font-bold mt-2 text-green-600">₹{data?.todaysRevenue || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="text-gray-500 text-sm flex items-center"><TrendingUp size={14} className="mr-1" /> Monthly Rev.</div>
          <div className="text-2xl font-bold mt-2">₹{data?.monthlyRevenue || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="text-gray-500 text-sm flex items-center"><IndianRupee size={14} className="mr-1" /> Est. Profit (All-Time)</div>
          <div className="text-2xl font-bold mt-2 text-indigo-600">₹{profit?.profit || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="text-gray-500 text-sm flex items-center"><ShoppingBag size={14} className="mr-1" /> Orders Today</div>
          <div className="text-2xl font-bold mt-2">{data?.todayOrders || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="text-gray-500 text-sm flex items-center"><IndianRupee size={14} className="mr-1" /> Avg Order</div>
          <div className="text-2xl font-bold mt-2">₹{data?.avgOrderValue || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="text-gray-500 text-sm flex items-center"><Users size={14} className="mr-1" /> Rating</div>
          <div className="text-2xl font-bold mt-2 text-yellow-500">★ {data?.rating || '0.0'}</div>
        </div>
      </div>

      {/* AI Insights Engine */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <TrendingUp size={20} className="mr-2 text-indigo-500" /> AI Business Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, idx) => (
            <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 ${
              insight.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' :
              insight.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Profit Breakdown */}
      <div className="mt-8 bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold mb-4">Financial Health (All Time)</h2>
        <div className="flex flex-col md:flex-row justify-between items-center border-t pt-4">
          <div className="text-center w-full mb-4 md:mb-0">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">₹{profit?.revenue || 0}</p>
          </div>
          <div className="text-2xl font-light text-gray-300 hidden md:block">-</div>
          <div className="text-center w-full mb-4 md:mb-0">
            <p className="text-gray-500 text-sm">Inventory & Waste Cost</p>
            <p className="text-2xl font-bold text-red-500">₹{profit?.cost || 0}</p>
          </div>
          <div className="text-2xl font-light text-gray-300 hidden md:block">=</div>
          <div className="text-center w-full">
            <p className="text-gray-500 text-sm">Estimated Profit</p>
            <p className="text-3xl font-bold text-indigo-600">₹{profit?.profit || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
