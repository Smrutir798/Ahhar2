import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { UserPlus, Trash2, Phone, Shield, User, Key, Users, Search, ChefHat } from 'lucide-react';

const StaffManagement = () => {
  const { user } = useContext(AuthContext);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generalForm, setGeneralForm] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'waiter'
  });
  const [kitchenForm, setKitchenForm] = useState({
    name: '',
    phone: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resetModal, setResetModal] = useState({
    isOpen: false,
    staffId: '',
    staffName: '',
    newPassword: ''
  });

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

  const handleGeneralInputChange = (e) => {
    const { name, value } = e.target;
    setGeneralForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleKitchenInputChange = (e) => {
    const { name, value } = e.target;
    setKitchenForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await axios.post('/staff', generalForm);
      // Reset form
      setGeneralForm({ name: '', phone: '', password: '', role: 'waiter' });
      // Refresh list
      fetchStaff();
    } catch (err) {
      console.error('Failed to enroll staff:', err);
      setError(err.response?.data?.message || 'Failed to enroll staff member. Please check details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKitchenSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await axios.post('/staff', { ...kitchenForm, role: 'kitchen' });
      // Reset form
      setKitchenForm({ name: '', phone: '', password: '' });
      // Refresh list
      fetchStaff();
    } catch (err) {
      console.error('Failed to enroll kitchen staff:', err);
      setError(err.response?.data?.message || 'Failed to enroll kitchen staff member. Please check details.');
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

  const handlePasswordResetSubmit = async () => {
    const { staffId, staffName, newPassword } = resetModal;
    if (newPassword.trim().length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    
    try {
      await axios.put(`/staff/${staffId}/password`, { password: newPassword.trim() });
      setResetModal({ isOpen: false, staffId: '', staffName: '', newPassword: '' });
      alert(`Password for ${staffName} has been reset successfully.`);
    } catch (err) {
      console.error('Failed to reset staff password:', err);
      alert(err.response?.data?.message || 'Failed to reset password.');
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
        {/* Sidebar Column: Forms */}
        <div className="space-y-6 lg:col-span-1">
          {/* Enroll General Staff Form */}
          <Card className="bg-white shadow-sm border border-gray-200/60 rounded-[24px] overflow-hidden h-fit">
            <CardHeader className="p-6 pb-4 bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
                <UserPlus size={18} className="text-gray-500" />
                Enroll New Staff
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Create an account for waitstaff, cashiers, or inventory managers.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleGeneralSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gen-name" className="text-xs font-bold text-gray-700">Full Name</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <User size={16} />
                    </span>
                    <Input
                      id="gen-name"
                      name="name"
                      type="text"
                      required
                      className="bg-gray-50 border-gray-200 focus-visible:ring-black h-10 pl-10 rounded-xl"
                      placeholder="e.g. John Doe"
                      value={generalForm.name}
                      onChange={handleGeneralInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gen-phone" className="text-xs font-bold text-gray-700">Phone Number</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Phone size={16} />
                    </span>
                    <Input
                      id="gen-phone"
                      name="phone"
                      type="tel"
                      required
                      className="bg-gray-50 border-gray-200 focus-visible:ring-black h-10 pl-10 rounded-xl"
                      placeholder="e.g. 9876543210"
                      value={generalForm.phone}
                      onChange={handleGeneralInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gen-password" className="text-xs font-bold text-gray-700">Password</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Key size={16} />
                    </span>
                    <Input
                      id="gen-password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      className="bg-gray-50 border-gray-200 focus-visible:ring-black h-10 pl-10 rounded-xl"
                      placeholder="Min 6 characters"
                      value={generalForm.password}
                      onChange={handleGeneralInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gen-role" className="text-xs font-bold text-gray-700">Assigned Role</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Shield size={16} />
                    </span>
                    <select
                      id="gen-role"
                      name="role"
                      required
                      className="w-full bg-gray-50 border border-gray-200 focus-visible:ring-black h-10 pl-10 pr-4 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                      value={generalForm.role}
                      onChange={handleGeneralInputChange}
                    >
                      <option value="waiter">Waiter</option>
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

          {/* Enroll Kitchen Staff Form */}
          <Card className="bg-white shadow-sm border border-gray-200/60 rounded-[24px] overflow-hidden h-fit">
            <CardHeader className="p-6 pb-4 bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
                <ChefHat size={18} className="text-gray-500" />
                Enroll Kitchen Staff
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Create a dedicated account for chefs and kitchen staff.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleKitchenSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kit-name" className="text-xs font-bold text-gray-700">Full Name</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <User size={16} />
                    </span>
                    <Input
                      id="kit-name"
                      name="name"
                      type="text"
                      required
                      className="bg-gray-50 border-gray-200 focus-visible:ring-black h-10 pl-10 rounded-xl"
                      placeholder="e.g. John Chef"
                      value={kitchenForm.name}
                      onChange={handleKitchenInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kit-phone" className="text-xs font-bold text-gray-700">Phone Number</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Phone size={16} />
                    </span>
                    <Input
                      id="kit-phone"
                      name="phone"
                      type="tel"
                      required
                      className="bg-gray-50 border-gray-200 focus-visible:ring-black h-10 pl-10 rounded-xl"
                      placeholder="e.g. 9876543211"
                      value={kitchenForm.phone}
                      onChange={handleKitchenInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kit-password" className="text-xs font-bold text-gray-700">Password</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Key size={16} />
                    </span>
                    <Input
                      id="kit-password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      className="bg-gray-50 border-gray-200 focus-visible:ring-black h-10 pl-10 rounded-xl"
                      placeholder="Min 6 characters"
                      value={kitchenForm.password}
                      onChange={handleKitchenInputChange}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 bg-black text-white hover:bg-gray-900 active:scale-95 transition-all rounded-xl shadow-md font-bold text-sm mt-2 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Enrolling Chef...' : 'Enroll Kitchen Staff'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

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
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              title="Reset Password"
                              className="h-9 w-9 p-0 text-amber-500 hover:text-white hover:bg-amber-500 border-gray-100 hover:border-amber-500 shadow-sm transition-all rounded-xl"
                              onClick={() => setResetModal({ isOpen: true, staffId: member._id, staffName: member.name, newPassword: '' })}
                            >
                              <Key size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              title="Remove Staff"
                              className="h-9 w-9 p-0 text-red-500 hover:text-white hover:bg-red-500 border-gray-100 hover:border-red-500 shadow-sm transition-all rounded-xl"
                              onClick={() => handleDelete(member._id, member.name)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
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
      {/* Reset Password Modal */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="bg-white shadow-xl border border-gray-200 w-full max-w-md rounded-2xl overflow-hidden animate-scale-in">
            <CardHeader className="bg-gray-50 p-6 border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
                <Key size={18} className="text-amber-500" />
                Reset Staff Password
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Change the password for <span className="font-bold text-black">{resetModal.staffName}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-password-input" className="text-xs font-bold text-gray-700">New Password</Label>
                <Input
                  id="reset-password-input"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter at least 6 characters"
                  value={resetModal.newPassword}
                  onChange={(e) => setResetModal(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="bg-gray-50 border-gray-200 focus-visible:ring-black h-10 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setResetModal({ isOpen: false, staffId: '', staffName: '', newPassword: '' })}
                  className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 h-10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordResetSubmit}
                  className="rounded-xl bg-black text-white hover:bg-gray-900 h-10 px-4 font-bold"
                >
                  Save Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
