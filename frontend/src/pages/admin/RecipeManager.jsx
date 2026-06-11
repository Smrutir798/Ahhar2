import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { ChefHat, Plus, Link } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const RecipeManager = () => {
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    menuItemId: '',
    ingredients: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [recRes, menuRes, invRes] = await Promise.all([
        axios.get('/recipes', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/menu', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/inventory', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRecipes(recRes.data);
      setMenuItems(menuRes.data);
      setIngredients(invRes.data);
    } catch (err) {
      console.error('Failed to fetch recipe data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (formData.ingredients.length === 0) return alert('Add at least one ingredient');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('/recipes', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      setShowAddModal(false);
      setFormData({ menuItemId: '', ingredients: [] });
    } catch (err) {
      alert("Failed to create recipe map.");
    }
  };

  const addIngredientToRecipe = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredientId: '', quantity: 1 }]
    });
  };

  const updateRecipeIng = (index, field, value) => {
    const newItems = [...formData.ingredients];
    newItems[index][field] = value;
    setFormData({ ...formData, ingredients: newItems });
  };

  const removeRecipeIng = (index) => {
    const newItems = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newItems });
  };

  if (loading) return <div className="p-8">Loading Recipes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recipe Management</h1>
          <p className="text-gray-500 text-sm">Map menu items to raw ingredients for auto-deduction</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}><Link size={18} className="mr-2" /> Map Recipe</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recipes.map(recipe => (
          <div key={recipe._id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-3 bg-red-50 text-red-500 rounded-xl"><ChefHat size={24} /></div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{recipe.menuItemId?.name || 'Unknown Item'}</h3>
                <p className="text-xs text-gray-500">Auto-deducts the following from inventory upon order</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {recipe.ingredients.map((ing, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="font-medium text-gray-800">{ing.ingredientId?.name || 'Unknown'}</span>
                  <span className="font-bold text-primary px-3 py-1 bg-white border rounded-full text-sm">
                    {ing.quantity} {ing.ingredientId?.unit}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button variant="outline" size="sm">Edit Recipe Map</Button>
            </div>
          </div>
        ))}
        {recipes.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-400 bg-white rounded-xl border">
            No recipes mapped yet. Menu items won't deduct inventory automatically until mapped.
          </div>
        )}
      </div>

      {/* Add Recipe Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Map Recipe to Menu Item</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Menu Item</label>
                <select required className="w-full border rounded-lg p-2" value={formData.menuItemId} onChange={e => setFormData({...formData, menuItemId: e.target.value})}>
                  <option value="">Select Menu Item</option>
                  {menuItems.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
              </div>
              
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Ingredients Required</h3>
                  <Button type="button" size="sm" variant="outline" onClick={addIngredientToRecipe}>+ Add Ingredient</Button>
                </div>
                
                {formData.ingredients.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1">Raw Ingredient</label>
                      <select required className="w-full border rounded-lg p-2 text-sm" value={item.ingredientId} onChange={e => updateRecipeIng(idx, 'ingredientId', e.target.value)}>
                        <option value="">Select</option>
                        {ingredients.map(ing => (
                          <option key={ing._id} value={ing._id}>{ing.name} ({ing.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium mb-1">Quantity</label>
                      <input required type="number" min="0" step="any" className="w-full border rounded-lg p-2 text-sm" value={item.quantity} onChange={e => updateRecipeIng(idx, 'quantity', Number(e.target.value))} />
                    </div>
                    <Button type="button" variant="outline" className="px-3" onClick={() => removeRecipeIng(idx)}>✕</Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit">Save Recipe Map</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeManager;
