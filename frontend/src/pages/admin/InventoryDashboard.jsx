import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import { Package, AlertTriangle, XOctagon, IndianRupee, Activity, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const InventoryDashboard = () => {
  const { user } = useContext(AuthContext);
  const [ingredients, setIngredients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    currentStock: 0,
    unit: 'Kg',
    minimumStock: 0,
    purchasePrice: 0,
    supplierId: ''
  });

  useEffect(() => {
    fetchInventory();
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
    }
  };

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIngredients(res.data);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/inventory', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIngredients([...ingredients, res.data]);
      setShowAddModal(false);
      setFormData({ name: '', category: '', currentStock: 0, unit: 'Kg', minimumStock: 0, purchasePrice: 0, supplierId: '' });
    } catch (err) {
      alert("Failed to add ingredient.");
    }
  };

  const totalIngredients = ingredients.length;
  const lowStock = ingredients.filter(i => i.currentStock > 0 && i.currentStock <= i.minimumStock).length;
  const outOfStock = ingredients.filter(i => i.currentStock === 0).length;
  const inventoryValue = ingredients.reduce((acc, i) => acc + (i.currentStock * i.purchasePrice), 0);

  if (loading) return <div className="p-8">Loading Inventory...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 text-sm">Real-time stock tracking and valuation</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}><Plus size={18} className="mr-2" /> Add Ingredient</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-500 text-sm">Total Ingredients</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalIngredients}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-500 text-sm">Low Stock Alert</h3>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-orange-600">{lowStock}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-500 text-sm">Out of Stock</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><XOctagon size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-red-600">{outOfStock}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-500 text-sm">Inventory Value</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><IndianRupee size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{inventoryValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-bold">Ingredient Master List</div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Ingredient</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Stock Level</th>
              <th className="px-6 py-3">Min Level</th>
              <th className="px-6 py-3">Price/Unit</th>
              <th className="px-6 py-3">Value</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map(ing => {
              const isLow = ing.currentStock > 0 && ing.currentStock <= ing.minimumStock;
              const isOut = ing.currentStock === 0;
              return (
                <tr key={ing._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{ing.name}</td>
                  <td className="px-6 py-4 text-gray-600">{ing.category}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-green-600'}`}>
                      {ing.currentStock} {ing.unit}
                    </span>
                    {isOut && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">Out of Stock</span>}
                    {isLow && <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase">Low Stock</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{ing.minimumStock} {ing.unit}</td>
                  <td className="px-6 py-4 text-gray-600">₹{ing.purchasePrice}</td>
                  <td className="px-6 py-4 font-bold">₹{ing.currentStock * ing.purchasePrice}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add New Ingredient</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input required type="text" className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input required type="text" className="w-full border rounded-lg p-2" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <select className="w-full border rounded-lg p-2" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option>Kg</option>
                    <option>Gram</option>
                    <option>Liter</option>
                    <option>Ml</option>
                    <option>Piece</option>
                    <option>Pack</option>
                    <option>Bottle</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Stock</label>
                  <input required type="number" min="0" step="any" className="w-full border rounded-lg p-2" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min. Stock</label>
                  <input required type="number" min="0" step="any" className="w-full border rounded-lg p-2" value={formData.minimumStock} onChange={e => setFormData({...formData, minimumStock: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price per Unit (₹)</label>
                  <input required type="number" min="0" step="any" className="w-full border rounded-lg p-2" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier</label>
                  <select className="w-full border rounded-lg p-2" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit">Add Ingredient</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;
