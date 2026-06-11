import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import { Clock, Star, CheckCircle, Activity } from 'lucide-react';

const ServiceAnalytics = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({
    totalRequests: 0,
    completedRequests: 0,
    avgResponseTime: 0,
    customerSatisfaction: 0
  });
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const [analyticsRes, feedbackRes] = await Promise.all([
          axios.get(`/analytics/services/${user.restaurantId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`/feedback/${user.restaurantId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setData(analyticsRes.data);
        setFeedbacks(feedbackRes.data);
      } catch (err) {
        console.error('Failed to fetch service analytics', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.restaurantId) fetchAnalytics();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Service Analytics...</div>;

  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service Analytics</h1>
        <p className="text-gray-500 text-sm">Monitor staff performance and customer satisfaction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-500 text-sm">Today's Requests</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.totalRequests}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-500 text-sm">Completed</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.completedRequests}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-500 text-sm">Avg Response Time</h3>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.avgResponseTime} <span className="text-lg text-gray-500">mins</span></p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-500 text-sm">Customer Rating</h3>
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Star size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.customerSatisfaction} <span className="text-lg text-gray-500">/ 5</span></p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm flex-1">
        <h3 className="font-bold text-gray-900 mb-6">Recent Customer Feedback</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3 rounded-tl-lg">Date</th>
                <th className="px-6 py-3">Table</th>
                <th className="px-6 py-3">Food Rating</th>
                <th className="px-6 py-3">Service Rating</th>
                <th className="px-6 py-3">Cleanliness</th>
                <th className="px-6 py-3 rounded-tr-lg">Comments</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-400">No feedback available yet.</td></tr>
              ) : (
                feedbacks.map((f) => (
                  <tr key={f._id} className="border-b">
                    <td className="px-6 py-4">{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold">Table {f.tableId?.tableNumber || '?'}</td>
                    <td className="px-6 py-4">⭐ {f.foodRating}</td>
                    <td className="px-6 py-4">⭐ {f.serviceRating}</td>
                    <td className="px-6 py-4">⭐ {f.cleanlinessRating}</td>
                    <td className="px-6 py-4 italic text-gray-600">"{f.comments || 'No comments'}"</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ServiceAnalytics;
