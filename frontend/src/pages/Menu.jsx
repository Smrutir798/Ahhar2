import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Trash2 } from 'lucide-react';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '', description: '', price: '', image: '', categoryId: ''
  });

  const fetchData = async () => {
    try {
      const [menuRes, catRes] = await Promise.all([
        axios.get('/menu'),
        axios.get('/categories')
      ]);
      setMenuItems(menuRes.data);
      setCategories(catRes.data);
      if (catRes.data.length > 0) {
        setNewItem(prev => ({ ...prev, categoryId: catRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/menu', {
        ...newItem,
        price: parseFloat(newItem.price)
      });
      setNewItem({ ...newItem, name: '', description: '', price: '', image: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to add item', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/menu/${id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await axios.put(`/menu/${item._id}`, { available: !item.available });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle availability', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-foreground pb-12">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-black">Menu Management</h1>
          <p className="text-muted-foreground mt-1 text-sm font-sans">Manage your dishes, prices, and availability.</p>
        </div>
        
        <Card className="bg-white shadow-sm border border-gray-200/60 rounded-[16px] overflow-hidden w-full">
          <div className="p-2.5 px-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Quick Add New Item</span>
          </div>
          <CardContent className="p-4">
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
              <div className="grid gap-1.5 md:col-span-1 xl:col-span-1">
                <Label htmlFor="name" className="text-xs font-bold text-gray-500">Name</Label>
                <Input id="name" required className="bg-gray-50 h-9 border-gray-200" placeholder="e.g. Burger" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div className="grid gap-1.5 md:col-span-1 xl:col-span-1">
                <Label htmlFor="category" className="text-xs font-bold text-gray-500">Category</Label>
                <select id="category" required className="flex h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black" value={newItem.categoryId} onChange={e => setNewItem({...newItem, categoryId: e.target.value})}>
                  <option value="" disabled>Select...</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5 md:col-span-1 xl:col-span-1">
                <Label htmlFor="price" className="text-xs font-bold text-gray-500">Price (₹)</Label>
                <Input id="price" type="number" step="0.01" required className="bg-gray-50 h-9 border-gray-200" placeholder="0.00" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
              </div>
              <div className="grid gap-1.5 md:col-span-2 xl:col-span-1">
                <Label htmlFor="image" className="text-xs font-bold text-gray-500">Image URL</Label>
                <Input id="image" type="url" className="bg-gray-50 h-9 border-gray-200" placeholder="https://..." value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} />
              </div>
              <div className="grid gap-1.5 md:col-span-2 xl:col-span-1">
                <Label htmlFor="description" className="text-xs font-bold text-gray-500">Description</Label>
                <Input id="description" className="bg-gray-50 h-9 border-gray-200" placeholder="Brief details..." value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
              </div>
              <div className="md:col-span-2 xl:col-span-1">
                <Button type="submit" className="w-full h-9 bg-black text-white hover:bg-gray-900 rounded-lg shadow-sm font-bold text-xs">
                  Add Item
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
        {menuItems.map(item => (
          <Card key={item._id} className={`overflow-hidden flex flex-col group hover:border-black/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white shadow-sm border rounded-[20px] ${!item.available ? 'opacity-60 grayscale-[0.5]' : 'border-gray-200'}`}>
            <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 font-medium text-xs">No Image</div>
              )}
              {!item.available && (
                <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">Out of Stock</span>
                </div>
              )}
            </div>
            
            <CardHeader className="p-4 pb-2 flex-1">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <CardTitle className="text-lg font-bold font-heading text-black leading-tight">{item.name}</CardTitle>
                  <CardDescription className="text-xs font-medium text-gray-500 mt-1">{item.categoryId?.name}</CardDescription>
                </div>
                <div className="text-sm font-black text-black bg-gray-100 px-2 py-1 rounded-md">₹{item.price}</div>
              </div>
              {item.description && <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed">{item.description}</p>}
            </CardHeader>
            
            <CardContent className="p-4 pt-0 flex gap-2 w-full mt-auto">
              <Button 
                variant="outline" 
                className={`flex-1 h-8 text-xs font-bold transition-all rounded-lg ${item.available ? 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200' : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'}`}
                onClick={() => toggleAvailability(item)}
              >
                {item.available ? 'Disable' : 'Enable'}
              </Button>
              <Button 
                variant="outline" 
                style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', color: '#A32D2D' }}
                className="h-8 w-10 p-0 shadow-sm transition-all rounded-lg hover:opacity-90" 
                onClick={() => handleDelete(item._id)}
              >
                <Trash2 size={14} className="lucide lucide-trash2" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {menuItems.length === 0 && <p className="text-gray-400 col-span-full font-sans text-sm p-8 text-center border-2 border-dashed border-gray-200 rounded-[20px]">No menu items found. Add one above.</p>}
      </div>
    </div>
  );
};

export default Menu;
