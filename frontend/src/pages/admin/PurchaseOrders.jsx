import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { PackageOpen, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const PurchaseOrders = () => {
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    supplierId: '',
    items: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [posRes, suppliersRes, invRes] = await Promise.all([
        axios.get('/purchase-orders', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/suppliers', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/inventory', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPos(posRes.data);
      setSuppliers(suppliersRes.data);
      setIngredients(invRes.data);
    } catch (err) {
      console.error('Failed to fetch PO data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) return alert('Add at least one item');
    
    // Calculate total
    const totalAmount = formData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/purchase-orders', { ...formData, totalAmount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Fetch full list again to get populated references
      fetchData();
      setShowAddModal(false);
      setFormData({ supplierId: '', items: [] });
    } catch (err) {
      alert("Failed to create PO.");
    }
  };

  const addItemToPO = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ingredientId: '', quantity: 1, price: 0 }]
    });
  };

  const updatePOItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-fill price if ingredient selected
    if (field === 'ingredientId') {
      const selectedIng = ingredients.find(i => i._id === value);
      if (selectedIng) newItems[index].price = selectedIng.purchasePrice;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const removePOItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const receivePO = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/purchase-orders/${id}/receive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPos(pos.map(po => po._id === id ? res.data : po));
      alert('Stock received and inventory updated!');
    } catch (err) {
      alert('Failed to receive PO');
    }
  };

  if (loading) return <div className="p-8">Loading Purchase Orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 text-sm">Manage incoming stock and supplier orders</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Create PO</Button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-bold">PO History</div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Supplier</th>
              <th className="px-6 py-3">Total Amount</th>
              <th className="px-6 py-3">Items</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {pos.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-400">No Purchase Orders yet.</td></tr>
            ) : (
              pos.map(po => (
                <tr key={po._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">{new Date(po.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold">{po.supplierId?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 font-bold">₹{po.totalAmount}</td>
                  <td className="px-6 py-4 text-gray-600">{po.items.length} items</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1 w-max ${
                      po.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {po.status === 'received' ? <CheckCircle size={14} /> : <Clock size={14} />} {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {po.status !== 'received' && (
                      <Button size="sm" onClick={() => receivePO(po._id)} className="bg-green-600 hover:bg-green-700">
                        Mark Received
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add PO Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Purchase Order</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Supplier</label>
                <select required className="w-full border rounded-lg p-2" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Order Items</h3>
                  <Button type="button" size="sm" variant="outline" onClick={addItemToPO}>+ Add Item</Button>
                </div>
                
                {formData.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1">Ingredient</label>
                      <select required className="w-full border rounded-lg p-2 text-sm" value={item.ingredientId} onChange={e => updatePOItem(idx, 'ingredientId', e.target.value)}>
                        <option value="">Select</option>
                        {ingredients.filter(i => formData.supplierId ? i.supplierId === formData.supplierId : true).map(ing => (
                          <option key={ing._id} value={ing._id}>{ing.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium mb-1">Qty</label>
                      <input required type="number" min="1" className="w-full border rounded-lg p-2 text-sm" value={item.quantity} onChange={e => updatePOItem(idx, 'quantity', Number(e.target.value))} />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium mb-1">Price (₹)</label>
                      <input required type="number" min="0" step="any" className="w-full border rounded-lg p-2 text-sm" value={item.price} onChange={e => updatePOItem(idx, 'price', Number(e.target.value))} />
                    </div>
                    <Button type="button" variant="outline" className="px-3" onClick={() => removePOItem(idx)}>✕</Button>
                  </div>
                ))}
                
                {formData.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-right font-bold text-lg">
                    Total: ₹{formData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0)}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit">Create PO</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
