import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Clock, ChefHat, UserCircle, Users, Activity, CheckCircle, Bell, ArrowRight, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

const StaffAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [waiterSearchQuery, setWaiterSearchQuery] = useState('');

  const filteredRequests = data?.recentRequests?.filter(req => {
    const query = searchQuery.toLowerCase();
    const tableNum = req.tableId?.tableNumber?.toString() || '';
    const requestType = req.requestType?.toLowerCase() || '';
    const customMessage = req.customMessage?.toLowerCase() || '';
    const status = req.status?.toLowerCase() || '';
    const handledBy = req.assignedTo?.name?.toLowerCase() || 'unclaimed';

    return (
      tableNum.includes(query) ||
      `table ${tableNum}`.includes(query) ||
      requestType.includes(query) ||
      customMessage.includes(query) ||
      status.includes(query) ||
      handledBy.includes(query)
    );
  }) || [];

  const filteredWaiters = data?.waiters?.filter(waiter => {
    const query = waiterSearchQuery.toLowerCase();
    const name = waiter.name?.toLowerCase() || '';
    const phone = waiter.phone?.toLowerCase() || '';
    const email = waiter.email?.toLowerCase() || '';

    return (
      name.includes(query) ||
      phone.includes(query) ||
      email.includes(query)
    );
  }) || [];

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

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds for live monitoring
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-600 border border-amber-200 shadow-sm animate-pulse">Pending</span>;
      case 'accepted':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-600 border border-blue-200 shadow-sm">Accepted</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">Completed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gray-50 text-gray-600 border border-gray-200 shadow-sm">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading Staff Performance BI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-foreground pb-12">
      <div>
        <h1 className="text-3xl font-bold font-heading tracking-tight text-black flex items-center gap-2">
          <Activity className="text-black h-8 w-8" />
          Staff Performance BI
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-sans">
          Track kitchen efficiency, waitstaff responsiveness, and live waiter actions.
        </p>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kitchen Analytics */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-200/60 shadow-sm flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 border border-amber-100 shadow-sm">
            <ChefHat size={28} />
          </div>
          <h2 className="text-lg font-bold text-black font-heading">Kitchen Efficiency</h2>
          <p className="text-gray-500 text-xs mt-1 mb-6 max-w-xs">Average time taken to prepare an order from acceptance to ready</p>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Avg Prep Time</p>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">{data?.avgPrepTimeMins || 0} <span className="text-xs font-normal text-gray-500">mins</span></p>
            </div>
            <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Orders Prepared</p>
              <p className="text-3xl font-extrabold text-gray-800 mt-1">{data?.ordersPrepared || 0}</p>
            </div>
          </div>
        </div>

        {/* Waitstaff Analytics */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-200/60 shadow-sm flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 shadow-sm">
            <UserCircle size={28} />
          </div>
          <h2 className="text-lg font-bold text-black font-heading">Waitstaff Responsiveness</h2>
          <p className="text-gray-500 text-xs mt-1 mb-6 max-w-xs">Average time taken to fulfill customer table requests</p>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Avg Wait Time</p>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">{data?.avgWaitTimeMins || 0} <span className="text-xs font-normal text-gray-500">mins</span></p>
            </div>
            <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Requests Fulfilled</p>
              <p className="text-3xl font-extrabold text-gray-800 mt-1">{data?.requestsCompleted || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Waitstaff Performance Table */}
      <Card className="bg-white shadow-sm border border-gray-200/60 rounded-[24px] overflow-hidden">
        <CardHeader className="p-6 pb-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
              <Users size={18} className="text-gray-500" />
              Waitstaff Activity Summary
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Performance metrics and current table assignments of individual waiters.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search waiter name or contact..."
              value={waiterSearchQuery}
              onChange={(e) => setWaiterSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all shadow-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!data?.waiters || data.waiters.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400 text-center">
              <p className="text-sm font-medium">No waitstaff enrolled.</p>
              <p className="text-xs text-gray-400 mt-0.5">Use Staff Management to add waiter accounts.</p>
            </div>
          ) : filteredWaiters.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400 text-center">
              <Search className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm font-medium">No matching waiters found.</p>
              <p className="text-xs text-gray-400 mt-0.5">Try searching for a different keyword.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Waiter Name</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Assigned Tables</th>
                    <th className="py-3 px-4 text-center">Active Requests</th>
                    <th className="py-3 px-4 text-center">Completed Requests</th>
                    <th className="py-3 px-4 text-right">Avg Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWaiters.map((waiter) => (
                    <tr key={waiter._id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                      <td className="py-4 px-4 font-bold text-black flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-600">
                          {waiter.name.charAt(0).toUpperCase()}
                        </div>
                        {waiter.name}
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-xs">
                        <div>{waiter.phone || 'No phone'}</div>
                        <div className="text-gray-400 text-[10px]">{waiter.email || ''}</div>
                      </td>
                      <td className="py-4 px-4">
                        {waiter.assignedTables.length === 0 ? (
                          <span className="text-gray-400 text-xs italic">Unassigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {waiter.assignedTables.map(tNum => (
                              <span key={tNum} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold text-[10px] border border-gray-200/50">T{tNum}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-blue-600">{waiter.activeRequestsCount}</td>
                      <td className="py-4 px-4 text-center font-bold text-emerald-600">{waiter.requestsCompleted}</td>
                      <td className="py-4 px-4 text-right font-bold text-indigo-600">
                        {waiter.avgFulfillTimeMins > 0 ? `${waiter.avgFulfillTimeMins} mins` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Action Monitor (Service Requests list) */}
      <Card className="bg-white shadow-sm border border-gray-200/60 rounded-[24px] overflow-hidden">
        <CardHeader className="p-6 pb-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
              <Clock size={18} className="text-gray-500" />
              Live Task & Action Monitor
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Real-time tracking of waiter tasks, claims, and response actions.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search table, task, waiter or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all shadow-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!data?.recentRequests || data.recentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400 text-center">
              <Bell className="h-8 w-8 text-gray-300 mb-2 animate-bounce" />
              <p className="text-sm font-medium">No service requests logged.</p>
              <p className="text-xs text-gray-400 mt-0.5">Live customer requests will show up here.</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400 text-center">
              <Search className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm font-medium">No matching requests found.</p>
              <p className="text-xs text-gray-400 mt-0.5">Try searching for a different keyword.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Table</th>
                    <th className="py-3 px-4">Request Action</th>
                    <th className="py-3 px-4">Custom Message</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Handled By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req._id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                      <td className="py-4 px-4 text-gray-500 text-xs">
                        {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-4 font-bold text-black">
                        Table {req.tableId?.tableNumber || '?'}
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-700">
                        {req.requestType}
                      </td>
                      <td className="py-4 px-4 italic text-gray-500 text-xs max-w-xs truncate">
                        {req.customMessage ? `"${req.customMessage}"` : '-'}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {req.assignedTo ? (
                          <div className="flex items-center gap-1.5 justify-end font-bold text-xs text-gray-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {req.assignedTo.name}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Unclaimed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffAnalytics;
