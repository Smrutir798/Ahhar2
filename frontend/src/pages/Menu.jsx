import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Trash2, FileSpreadsheet, Upload } from 'lucide-react';

const parseMenuCSV = (text) => {
  const lines = text.split(/\r?\n/);
  const result = [];
  let startIndex = 0;
  if (lines[0] && (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('dish') || lines[0].toLowerCase().includes('price'))) {
    startIndex = 1;
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current.trim());
    
    // Columns: name, category, price, description, image
    const name = columns[0] ? columns[0].replace(/^"|"$/g, '').trim() : '';
    const category = columns[1] ? columns[1].replace(/^"|"$/g, '').trim() : '';
    const priceStr = columns[2] ? columns[2].replace(/^"|"$/g, '').trim() : '';
    const description = columns[3] ? columns[3].replace(/^"|"$/g, '').trim() : '';
    const image = columns[4] ? columns[4].replace(/^"|"$/g, '').trim() : '';
    
    const price = parseFloat(priceStr);
    
    if (name && category && !isNaN(price)) {
      result.push({ name, category, price, description, image });
    }
  }
  return result;
};

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '', description: '', price: '', image: '', categoryId: ''
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [csvError, setCsvError] = useState('');

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

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    setCsvError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseMenuCSV(text);
        if (parsed.length === 0) {
          setCsvError('No valid dishes found in the CSV file. Expected columns: name, category, price, description, image.');
        } else {
          setParsedData(parsed);
        }
      } catch (err) {
        console.error(err);
        setCsvError('Error parsing CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearCSV = () => {
    setUploadFile(null);
    setParsedData([]);
    setCsvError('');
  };

  const handleImportCSV = async () => {
    if (parsedData.length === 0) return;
    setUploading(true);
    setCsvError('');
    try {
      // Map existing categories to IDs
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.name.toLowerCase()] = cat._id;
      });

      // Sequential import to correctly create categories on the fly
      for (const item of parsedData) {
        let categoryId = categoryMap[item.category.toLowerCase()];
        
        if (!categoryId) {
          try {
            console.log(`Creating category on the fly: ${item.category}`);
            const catRes = await axios.post('/categories', { name: item.category });
            categoryId = catRes.data._id;
            categoryMap[item.category.toLowerCase()] = categoryId;
            setCategories(prev => [...prev, catRes.data]);
          } catch (catErr) {
            console.error('Failed to create category on the fly:', catErr);
            throw new Error(`Failed to create category: ${item.category}`);
          }
        }

        await axios.post('/menu', {
          name: item.name,
          categoryId,
          price: item.price,
          description: item.description || '',
          image: item.image || ''
        });
      }

      fetchData();
      handleClearCSV();
      alert('Bulk menu items imported successfully!');
    } catch (err) {
      console.error(err);
      setCsvError(err.message || 'Failed to import some menu items. Please check CSV format.');
    } finally {
      setUploading(false);
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

        {/* Bulk Import Menu Items */}
        <Card className="bg-white shadow-sm border border-gray-200/60 rounded-[16px] overflow-hidden w-full">
          <div className="p-2.5 px-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-black" />
              Bulk Import Menu Items (CSV)
            </span>
          </div>
          <CardContent className="p-4 space-y-4">
            {csvError && <div className="text-red-500 text-xs font-semibold">{csvError}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Dropzone */}
              <div className="border-2 border-dashed border-gray-200 hover:border-black/20 rounded-2xl p-5 text-center cursor-pointer transition-all relative group flex flex-col items-center justify-center min-h-[120px]">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Upload className="h-6 w-6 text-gray-400 group-hover:text-black transition-colors mb-2" />
                <p className="text-xs font-bold text-gray-600">{uploadFile ? uploadFile.name : 'Choose CSV file'}</p>
                <p className="text-[10px] text-gray-400 mt-1">Expected format: name, category, price, description, image</p>
              </div>

              {/* Parsed List Preview */}
              {parsedData.length > 0 && (
                <div className="md:col-span-2 space-y-3 animate-fade-in font-sans">
                  <div className="bg-gray-50 rounded-xl p-3 max-h-32 overflow-y-auto text-xs space-y-1">
                    <p className="font-bold text-gray-500 mb-1.5">Parsed Items ({parsedData.length}):</p>
                    {parsedData.map((item, idx) => (
                      <div key={idx} className="flex justify-between border-b border-gray-100 pb-1 items-center gap-2">
                        <div>
                          <span className="font-bold text-black">{item.name}</span>
                          <span className="ml-2 text-[9px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{item.category}</span>
                        </div>
                        <div className="flex gap-4 items-center">
                          <span className="text-gray-500 font-medium truncate max-w-[120px]">{item.description || 'No description'}</span>
                          <span className="font-bold text-black">₹{item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleClearCSV}
                      className="rounded-lg text-gray-600 border-gray-200 h-9 font-bold text-xs"
                      disabled={uploading}
                    >
                      Clear
                    </Button>
                    <Button 
                      onClick={handleImportCSV} 
                      className="rounded-lg bg-black text-white font-bold text-xs h-9 px-4"
                      disabled={uploading}
                    >
                      {uploading ? 'Importing Items...' : 'Import All Items'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
