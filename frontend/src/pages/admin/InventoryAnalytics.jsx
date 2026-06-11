import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { PackageSearch } from 'lucide-react';

const InventoryAnalytics = () => {
  const [data, setData] = useState({
    topUsed: [],
    stockLevels: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      // For now, we will construct dummy data if the API doesn't exist, or just use ingredients
      const res = await axios.get('/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const ingredients = res.data;
      
      // Constructing display data from ingredients
      const stockLevels = ingredients.map(ing => ({
        name: ing.name,
        current: ing.currentStock,
        minimum: ing.minimumStock
      })).slice(0, 10); // Show top 10 for chart clarity
      
      setData({ stockLevels });
    } catch (err) {
      console.error('Failed to fetch inventory analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Analytics...</div>;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Analytics</h1>
        <p className="text-gray-500 text-sm">Visualize stock levels and consumption trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        {/* Stock Levels Chart */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><PackageSearch size={20} /></div>
            <h3 className="font-bold text-gray-900">Current Stock vs Minimum Threshold</h3>
          </div>
          
          <div className="flex-1 min-h-[300px]">
            {data.stockLevels.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">No ingredients added yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stockLevels}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Bar dataKey="current" name="Current Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="minimum" name="Min Threshold" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Dummy Consumption Trend Chart */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><PackageSearch size={20} /></div>
            <h3 className="font-bold text-gray-900">Weekly Value Trend (Coming Soon)</h3>
          </div>
          
          <div className="flex-1 min-h-[300px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
             <p className="text-gray-400 font-medium">More historical analytics unlock as stock logs accumulate.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryAnalytics;
