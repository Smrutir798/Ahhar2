import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const COLORS = ['#090b10', '#1e293b', '#475569', '#64748b', '#94a3b8'];

const RevenueDashboard = () => {
  const [revenueData, setRevenueData] = useState({ trend: [], byMethod: [] });
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendView, setTrendView] = useState('line'); // 'line' | 'bar'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [revRes, menuRes] = await Promise.all([
        axios.get('/analytics/revenue', { headers }),
        axios.get('/analytics/menu', { headers })
      ]);
      
      setRevenueData(revRes.data);
      setMenuData(menuRes.data);
    } catch (err) {
      console.error('Failed to fetch revenue analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-foreground font-heading">Loading Revenue Analytics...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-foreground">
      <div>
        <h1 className="text-3xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-foreground/50">Sales & Revenue Analytics</h1>
        <p className="text-muted-foreground mt-1 font-sans">Deep dive into your revenue streams and top products</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="p-6 hover:border-foreground/25 transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold font-heading">Revenue Trend (Last 7 Days)</h2>
            <div className="glass p-0.5 rounded-lg flex border border-border/10 shadow-sm w-fit">
              <button 
                onClick={() => setTrendView('line')}
                className={`px-3 py-1 rounded-md font-bold font-sans text-xs transition-all duration-300 ${trendView === 'line' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Line View
              </button>
              <button 
                onClick={() => setTrendView('bar')}
                className={`px-3 py-1 rounded-md font-bold font-sans text-xs transition-all duration-300 ${trendView === 'bar' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Bar View
              </button>
            </div>
          </div>
          <div className="h-72 font-sans">
            <ResponsiveContainer width="100%" height="100%">
              {trendView === 'line' ? (
                <AreaChart data={revenueData.trend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="currentColor" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="_id" tick={{fontSize: 12, fill: 'currentColor'}} className="text-muted-foreground" />
                  <YAxis tick={{fontSize: 12, fill: 'currentColor'}} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="currentColor" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" className="text-foreground" />
                </AreaChart>
              ) : (
                <BarChart data={revenueData.trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="_id" tick={{fontSize: 12, fill: 'currentColor'}} className="text-muted-foreground" />
                  <YAxis tick={{fontSize: 12, fill: 'currentColor'}} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Bar dataKey="revenue" fill="currentColor" radius={[4, 4, 0, 0]} className="text-foreground/80" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-6 hover:border-foreground/25 transition-all duration-300">
          <h2 className="text-lg font-bold font-heading mb-4">Revenue by Payment Method</h2>
          <div className="h-72 flex items-center justify-center font-sans">
            {revenueData.byMethod.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueData.byMethod}
                    dataKey="revenue"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({name, value}) => `${name}: ₹${value}`}
                  >
                    {revenueData.byMethod.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">No payment data available</p>
            )}
          </div>
        </Card>

        {/* Best Sellers */}
        <Card className="p-6 lg:col-span-2 hover:border-foreground/25 transition-all duration-300">
          <h2 className="text-lg font-bold font-heading mb-4">Top 10 Best Sellers</h2>
          <div className="h-80 font-sans">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={menuData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="opacity-10" />
                <XAxis type="number" tick={{fill: 'currentColor'}} />
                <YAxis dataKey="_id" type="category" width={150} tick={{fontSize: 12, fill: 'currentColor'}} className="text-muted-foreground" />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                <Bar dataKey="quantitySold" fill="#64748b" name="Quantity Sold" radius={[0, 4, 4, 0]} />
                <Bar dataKey="revenue" fill="currentColor" name="Revenue Generated (₹)" radius={[0, 4, 4, 0]} className="text-foreground/80" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RevenueDashboard;
