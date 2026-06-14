import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/categories', newCategory);
      setNewCategory({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      console.error('Failed to add category', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-foreground/50">Category Management</h1>
        <p className="text-muted-foreground mt-1 text-sm font-sans">Manage your menu categories and groupings.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Card - Left Column */}
        <div className="lg:col-span-1">
          <Card className="bg-white border shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading">Add New Category</CardTitle>
              <CardDescription className="font-sans">Create a category to group your menu items.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCategory} className="flex flex-col gap-4 font-sans">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-xs font-bold text-gray-500">Category Name</Label>
                  <Input id="name" placeholder="e.g. Starters" required value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="bg-gray-50 border-gray-200" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-xs font-bold text-gray-500">Description (Optional)</Label>
                  <Input id="description" placeholder="Short description" value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} className="bg-gray-50 border-gray-200" />
                </div>
                <Button type="submit" className="w-full font-bold">Add Category</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Existing Categories - Right Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold font-heading">Existing Categories</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map(category => (
              <Card key={category._id} className="bg-white border shadow-sm flex flex-col justify-between hover:border-black/20 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold font-heading text-black">{category.name}</CardTitle>
                  {category.description && <CardDescription className="text-xs text-gray-500 font-sans">{category.description}</CardDescription>}
                </CardHeader>
                <CardContent className="pt-0 flex justify-end">
                  <Button 
                    variant="outline" 
                    style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', color: '#A32D2D' }}
                    size="sm" 
                    className="hover:opacity-90 transition-all duration-300 font-bold text-xs"
                    onClick={() => handleDelete(category._id)}
                  >
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
            {categories.length === 0 && (
              <p className="text-gray-400 col-span-full font-sans text-sm p-8 text-center border-2 border-dashed border-gray-200 rounded-[20px]">
                No categories found. Add one on the left.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
