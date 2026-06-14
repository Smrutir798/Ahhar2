import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { UserPlus, Trash2, Phone, Shield, User, Key, Users, Search } from 'lucide-react';

const StaffManagement = () => {
  const { user } = useContext(AuthContext);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'waiter'
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStaff = staffList.filter((member) => {
    const query = searchQuery.toLowerCase();
    const name = member.name?.toLowerCase() || '';
    const phone = member.phone?.toLowerCase() || '';
    const email = member.email?.toLowerCase() || '';
    const role = member.role?.toLowerCase() || '';
    
    return (
      name.includes(query) ||
      phone.includes(query) ||
      email.includes(query) ||
      role.includes(query)
    );
  });

  const fetchStaff = async () => {
    try {
      const res = await axios.get('/staff');
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
      setError('Could not load staff list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await axios.post('/staff', form);
      // Reset form
      setForm({ name: '', phone: '', password: '', role: 'waiter' });
      // Refresh list
      fetchStaff();
    } catch (err) {
      console.error('Failed to enroll staff:', err);
      setError(err.response?.data?.message || 'Failed to enroll staff member. Please check details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your staff?`)) return;
    try {
      await axios.delete(`/staff/${id}`);
      fetchStaff();
    } catch (err) {
      console.error('Failed to remove staff:', err);
      alert(err.response?.data?.message || 'Failed to remove staff member.');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'waiter':
        return <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">Waiter</span>;
      case 'kitchen':
        return <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-50 text-amber-600 border border-amber-100">Kitchen</span>;
      case 'cashier':
        return <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">Cashier</span>;
      case 'inventory_manager':
        return <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-rose-50 text-rose-600 border border-rose-100">Inventory</span>;
      default:
        return <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-gray-50 text-gray-600 border border-gray-100">{role}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-foreground pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-black flex items-center gap-2">
            <Users className="text-black h-8 w-8" />
            Staff Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-sans">
            Enroll and manage the staff accounts for your restaurant.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-pulse">
          {error}
        </div>
      )}

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Enroll Form */}
        <Card className="bg-white shadow-sm border border-gray-200/60 rounded-[24px] overflow-hidden h-fit">
          <CardHeader className="p-6 pb-4 bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
              <UserPlus size={18} className="text-gray-500" />
              Enroll New Staff
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Create an account for waitstaff, kitchen staff, cashiers, or inventory managers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold text-gray-700">Full Name</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <User size={16} />
                  </span>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="bg-gray-50 border-gray-200 focus-visible:ring-black h-10 pl-10 rounded-xl"
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold text-gray-700">Phone Number</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Phone size={16} />
                  </span>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="bg-gray-50 border-gray-200 focus-visible:ring-black h-10 pl-10 rounded-xl"
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold text-gray-700">Password</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Key size={16} />
                  </span>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="bg-gray-50 border-gray-200 focus-visible:ring-black h-10 pl-10 rounded-xl"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs font-bold text-gray-700">Assigned Role</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Shield size={16} />
                  </span>
                  <select
                    id="role"
                    name="role"
                    required
                    className="w-full bg-gray-50 border border-gray-200 focus-visible:ring-black h-10 pl-10 pr-4 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                    value={form.role}
                    onChange={handleInputChange}
                  >
                    <option value="waiter">Waiter</option>
                    <option value="kitchen">Kitchen Staff</option>
                    <option value="cashier">Cashier</option>
                    <option value="inventory_manager">Inventory Manager</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-black text-white hover:bg-gray-900 active:scale-95 transition-all rounded-xl shadow-md font-bold text-sm mt-2 flex items-center justify-center gap-2"
              >
                {submitting ? 'Enrolling...' : 'Enroll Staff'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Staff List */}
        <Card className="bg-white shadow-sm border border-gray-200/60 rounded-[24px] overflow-hidden lg:col-span-2">
          <CardHeader className="p-6 pb-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-black">Active Staff Members</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                List of staff accounts registered under this restaurant branch.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search size={16} />
              </span>
              <Input
                type="text"
                placeholder="Search staff name, phone, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-gray-200 text-xs font-semibold text-gray-700 pl-10 pr-4 py-2 rounded-xl focus-visible:ring-black h-9 shadow-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-3"></div>
                <p className="text-sm">Loading staff members...</p>
              </div>
            ) : staffList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                <Users size={36} className="text-gray-300 mb-3" />
                <p className="text-sm font-medium">No staff members enrolled yet.</p>
                <p className="text-xs text-gray-400 mt-1">Use the form on the left to add your first waiter or staff account.</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                <Search size={36} className="text-gray-300 mb-3" />
                <p className="text-sm font-medium">No matching staff members found.</p>
                <p className="text-xs text-gray-400 mt-1">Try searching for a different keyword or name.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 font-bold">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((member) => (
                      <tr key={member._id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors group">
                        <td className="py-4 px-4 font-bold text-black flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-600">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          {member.name}
                        </td>
                        <td className="py-4 px-4 text-gray-600 font-medium">{member.phone || member.email || 'N/A'}</td>
                        <td className="py-4 px-4">{getRoleBadge(member.role)}</td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="outline"
                            className="h-9 w-9 p-0 text-red-500 hover:text-white hover:bg-red-500 border-gray-100 hover:border-red-500 shadow-sm transition-all rounded-xl ml-auto"
                            onClick={() => handleDelete(member._id, member.name)}
                          >
                            <Trash2 size={16} />
                          </Button>
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
    </div>
  );
};

export default StaffManagement;
