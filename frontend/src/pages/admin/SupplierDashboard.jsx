import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Truck, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const SupplierDashboard = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/suppliers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/suppliers', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuppliers([...suppliers, res.data]);
      setShowAddModal(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
    } catch (err) {
      alert("Failed to add supplier.");
    }
  };

  if (loading) return <div className="p-8">Loading Suppliers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Directory</h1>
          <p className="text-gray-500 text-sm">Manage your inventory vendors</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Supplier</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(sup => (
          <div key={sup._id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Truck size={24} /></div>
                <h3 className="font-bold text-lg text-gray-900">{sup.name}</h3>
              </div>
              <span className={`w-3 h-3 rounded-full ${sup.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3"><Phone size={16} /> {sup.phone || 'N/A'}</div>
              <div className="flex items-center gap-3"><Mail size={16} /> {sup.email || 'N/A'}</div>
              <div className="flex items-start gap-3"><MapPin size={16} className="shrink-0 mt-0.5" /> <span className="line-clamp-2">{sup.address || 'N/A'}</span></div>
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-end gap-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button size="sm">Create PO</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add New Supplier</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Supplier Name</label>
                <input required type="text" className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input type="text" className="w-full border rounded-lg p-2" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" className="w-full border rounded-lg p-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea className="w-full border rounded-lg p-2" rows="3" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit">Add Supplier</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierDashboard;
