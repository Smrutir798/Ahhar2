import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { FileSpreadsheet, Upload } from 'lucide-react';

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/);
  const result = [];
  let startIndex = 0;
  if (lines[0] && (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('category'))) {
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
    
    const name = columns[0] ? columns[0].replace(/^"|"$/g, '').trim() : '';
    const description = columns[1] ? columns[1].replace(/^"|"$/g, '').trim() : '';
    
    if (name) {
      result.push({ name, description });
    }
  }
  return result;
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [csvError, setCsvError] = useState('');

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

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    setCsvError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setCsvError('No valid categories found in the CSV file.');
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
      const promises = parsedData.map(item => axios.post('/categories', item));
      await Promise.all(promises);
      fetchCategories();
      handleClearCSV();
      alert('Bulk categories imported successfully!');
    } catch (err) {
      console.error(err);
      setCsvError('Failed to import some categories. Please try again.');
    } finally {
      setUploading(false);
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
        <div className="lg:col-span-1 space-y-6">
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

          {/* Bulk Upload CSV */}
          <Card className="bg-white border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading flex items-center gap-2 text-md">
                <FileSpreadsheet className="h-5 w-5 text-black" />
                Bulk Import CSV
              </CardTitle>
              <CardDescription className="font-sans text-xs">Upload a CSV file to add multiple categories at once.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {csvError && <div className="text-red-500 text-xs font-medium">{csvError}</div>}
              
              <div className="border-2 border-dashed border-gray-200 hover:border-black/20 rounded-2xl p-6 text-center cursor-pointer transition-all relative group">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Upload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-black transition-colors mb-2" />
                <p className="text-xs font-bold text-gray-600">{uploadFile ? uploadFile.name : 'Choose CSV file'}</p>
                <p className="text-[10px] text-gray-400 mt-1">Expected format: name, description</p>
              </div>

              {parsedData.length > 0 && (
                <div className="space-y-3 animate-fade-in font-sans">
                  <div className="bg-gray-50 rounded-xl p-3 max-h-32 overflow-y-auto text-xs space-y-1">
                    <p className="font-bold text-gray-500 mb-1.5">Parsed Categories ({parsedData.length}):</p>
                    {parsedData.map((item, idx) => (
                      <div key={idx} className="flex justify-between border-b border-gray-100 pb-1">
                        <span className="font-bold text-black">{item.name}</span>
                        <span className="text-gray-500 truncate max-w-[120px]">{item.description || 'No description'}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleClearCSV}
                      className="w-1/2 rounded-xl text-gray-600 border-gray-200"
                      disabled={uploading}
                    >
                      Clear
                    </Button>
                    <Button 
                      onClick={handleImportCSV} 
                      className="w-1/2 rounded-xl bg-black text-white font-bold"
                      disabled={uploading}
                    >
                      {uploading ? `Importing...` : 'Import All'}
                    </Button>
                  </div>
                </div>
              )}
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
