import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Download, Clock, ChefHat, UserCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const StaffAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/analytics/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch staff analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Staff Analytics...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Performance Analytics</h1>
          <p className="text-gray-500">Track kitchen efficiency and waitstaff responsiveness</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kitchen Analytics */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
            <ChefHat size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Kitchen Efficiency</h2>
          <p className="text-gray-500 mb-6">Average time taken to prepare an order from acceptance to ready</p>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Avg Prep Time</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{data?.avgPrepTimeMins || 0} <span className="text-sm font-normal text-gray-500">mins</span></p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Orders Prepared</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{data?.ordersPrepared || 0}</p>
            </div>
          </div>
        </div>

        {/* Waitstaff Analytics */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <UserCircle size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Waitstaff Responsiveness</h2>
          <p className="text-gray-500 mb-6">Average time taken to fulfill customer table requests</p>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Avg Wait Time</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{data?.avgWaitTimeMins || 0} <span className="text-sm font-normal text-gray-500">mins</span></p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Requests Fulfuilled</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{data?.requestsCompleted || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffAnalytics;
