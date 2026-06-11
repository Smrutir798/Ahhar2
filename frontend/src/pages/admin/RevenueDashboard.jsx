import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '../../components/ui/Button';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const RevenueDashboard = () => {
  const [revenueData, setRevenueData] = useState({ trend: [], byMethod: [] });
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8">Loading Revenue Analytics...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales & Revenue Analytics</h1>
        <p className="text-gray-500">Deep dive into your revenue streams and top products</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-bold mb-4">Revenue Trend (Last 7 Days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData.trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="_id" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-bold mb-4">Revenue by Payment Method</h2>
          <div className="h-72 flex items-center justify-center">
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400">No payment data available</p>
            )}
          </div>
        </div>

        {/* Best Sellers */}
        <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold mb-4">Top 10 Best Sellers</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={menuData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="_id" type="category" width={150} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="quantitySold" fill="#10b981" name="Quantity Sold" radius={[0, 4, 4, 0]} />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue Generated (₹)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueDashboard;
