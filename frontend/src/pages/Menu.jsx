import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Add Menu Item</CardTitle>
          <CardDescription>Add a new dish to your restaurant's menu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddItem} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newItem.categoryId} 
                  onChange={e => setNewItem({...newItem, categoryId: e.target.value})}
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" type="number" step="0.01" required value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" type="url" placeholder="https://example.com/image.jpg" value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
            </div>

            <Button type="submit" className="w-full md:w-auto md:justify-self-end">Add Item</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {menuItems.map(item => (
          <Card key={item._id} className="overflow-hidden flex flex-col">
            {item.image && (
              <div className="w-full h-48 bg-muted">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <CardHeader className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{item.name}</CardTitle>
                  <CardDescription className="mt-1">{item.categoryId?.name}</CardDescription>
                </div>
                <div className="text-lg font-bold text-primary">₹{item.price}</div>
              </div>
              {item.description && <p className="text-sm text-muted-foreground mt-2">{item.description}</p>}
            </CardHeader>
            <CardContent className="bg-muted/20 pt-4 flex justify-between items-center border-t">
              <Button 
                variant={item.available ? "outline" : "secondary"} 
                size="sm" 
                onClick={() => toggleAvailability(item)}
              >
                {item.available ? 'Mark Unavailable' : 'Mark Available'}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(item._id)}>Delete</Button>
            </CardContent>
          </Card>
        ))}
        {menuItems.length === 0 && <p className="text-muted-foreground col-span-full">No menu items found. Add one above.</p>}
      </div>
    </div>
  );
};

export default Menu;
