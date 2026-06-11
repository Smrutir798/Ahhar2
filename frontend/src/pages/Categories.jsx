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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
      
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>Create a category to group your menu items.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Category Name</Label>
              <Input id="name" placeholder="e.g. Starters" required value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input id="description" placeholder="Short description" value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} />
            </div>
            <Button type="submit" className="self-end">Add Category</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map(category => (
          <Card key={category._id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{category.name}</CardTitle>
              {category.description && <CardDescription>{category.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(category._id)}>Delete</Button>
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && <p className="text-muted-foreground col-span-full">No categories found. Add one above.</p>}
      </div>
    </div>
  );
};

export default Categories;
