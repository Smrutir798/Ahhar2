import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '@/lib/axios';
import { CartContext } from '../../context/CartContext';
import { Search, ShoppingBag, Plus, Minus, X, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CustomerMenu = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { cartCount, addToCart, session, setSession } = useContext(CartContext);
  
  const [table, setTable] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  
  const handleSelectSingleModifier = (modifierName, option) => {
    setSelectedModifiers(prev => {
      const filtered = prev.filter(m => m.name !== modifierName);
      return [...filtered, { name: modifierName, option: option.name, price: option.price }];
    });
  };

  const handleSelectMultipleModifier = (modifierName, option, isChecked) => {
    setSelectedModifiers(prev => {
      if (isChecked) {
        return [...prev, { name: modifierName, option: option.name, price: option.price }];
      } else {
        return prev.filter(m => !(m.name === modifierName && m.option === option.name));
      }
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get Table & Restaurant
        const tableRes = await axios.get(`/customer/table/${tableId}`);
        setTable(tableRes.data.table);
        setRestaurant(tableRes.data.restaurant);
        const ownerId = tableRes.data.restaurant.ownerId;

        // 2. Get Menu
        const menuRes = await axios.get(`/customer/menu/${ownerId}`);
        setCategories(menuRes.data.categories);
        setItems(menuRes.data.items);

        // 3. Create or Get Session
        const sessionRes = await axios.post('/customer/session/create', {
          tableId: tableId,
          restaurantId: tableRes.data.restaurant._id
        });
        setSession(sessionRes.data);
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, [tableId, setSession]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenItem = (item) => {
    setSelectedItem(item);
    setQuantity(1);
    setInstructions('');
    
    // Auto-select defaults for required single modifiers
    const defaults = [];
    if (item.modifiers) {
      item.modifiers.forEach(m => {
        if (m.required && m.type === 'single' && m.options && m.options.length > 0) {
          defaults.push({ name: m.name, option: m.options[0].name, price: m.options[0].price });
        }
      });
    }
    setSelectedModifiers(defaults);
  };

  const handleAddToCart = () => {
    addToCart(selectedItem, quantity, instructions, selectedModifiers);
    setSelectedItem(null);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading Menu...</div>;
  if (!table) return <div className="flex-1 flex items-center justify-center">Invalid Table QR Code</div>;

  return (
    <div className="flex flex-col flex-1 bg-transparent pb-24 text-foreground">
      {/* Header */}
      <div className="bg-card/40 backdrop-blur-xl border-b border-border/40 px-4 py-4 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/50">{restaurant?.name}</h1>
            <p className="text-sm text-muted-foreground font-medium font-sans">Table {table?.tableNumber}</p>
          </div>
          <button 
            className="p-2 bg-foreground/5 hover:bg-foreground/10 active:scale-95 rounded-full text-foreground relative flex items-center gap-2 transition-all duration-300 border border-border"
            onClick={() => navigate(`/menu/table/${tableId}/history`)}
          >
            <Receipt size={20} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search food..." 
            className="w-full bg-foreground/5 border border-border text-foreground rounded-xl pl-10 pr-4 py-2.5 text-sm focus:bg-foreground/10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300 placeholder:text-muted-foreground/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card/20 backdrop-blur-lg border-b border-border/40 overflow-x-auto whitespace-nowrap px-4 py-3 sticky top-[120px] z-10 hide-scrollbar">
        <button 
          className={`inline-block px-5 py-2 rounded-full text-sm font-medium mr-2 transition-all duration-300 ${activeCategory === 'All' ? 'bg-foreground text-background shadow-md shadow-foreground/10 scale-105 font-semibold' : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'}`}
          onClick={() => setActiveCategory('All')}
        >
          All
        </button>
        {categories.map(cat => (
          <button 
            key={cat._id}
            className={`inline-block px-5 py-2 rounded-full text-sm font-medium mr-2 transition-all duration-300 ${activeCategory === cat._id ? 'bg-foreground text-background shadow-md shadow-foreground/10 scale-105 font-semibold' : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'}`}
            onClick={() => setActiveCategory(cat._id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="p-4 flex flex-col gap-4">
        {filteredItems.map(item => (
          <div 
            key={item._id} 
            className="bg-card/30 border border-border p-3 rounded-2xl shadow-sm flex gap-4 cursor-pointer active:scale-[0.98] hover:border-foreground/30 hover:-translate-y-0.5 transition-all duration-300"
            onClick={() => handleOpenItem(item)}
          >
            <div className="w-24 h-24 bg-foreground/5 border border-border/40 rounded-xl flex-shrink-0 overflow-hidden relative">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/60 text-xs text-center px-1">No Image</div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h3 className="font-bold text-foreground font-heading text-base">{item.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 font-sans">{item.description}</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-foreground font-heading text-base">₹{item.price}</span>
                <Button 
                  size="sm"
                  className="rounded-full px-4 py-1 h-8 font-bold border-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item, 1, '');
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center text-muted-foreground mt-10">No items found.</div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-20">
          <button 
            className="w-full max-w-sm bg-foreground text-background rounded-full p-4 font-bold flex justify-between items-center shadow-xl shadow-foreground/10 hover:scale-[1.02] active:scale-95 transition-all duration-300 border border-border"
            onClick={() => navigate(`/menu/table/${tableId}/cart`)}
          >
            <div className="flex items-center gap-2">
              <span className="bg-background text-foreground px-2 py-0.5 rounded-full text-sm">{cartCount}</span>
              <span className="font-heading">View Cart</span>
            </div>
            <ShoppingBag size={20} />
          </button>
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex flex-col justify-end">
          <div className="bg-card border border-border rounded-t-3xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <div className="relative h-56 bg-foreground/5 flex-shrink-0">
              {selectedItem.image && (
                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
              )}
              <button 
                className="absolute top-4 right-4 bg-background/80 p-2 rounded-full backdrop-blur-sm text-foreground border border-border active:scale-95 transition-all"
                onClick={() => setSelectedItem(null)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-auto">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-foreground font-heading">{selectedItem.name}</h2>
                <span className="text-xl font-bold text-foreground font-heading">₹{selectedItem.price}</span>
              </div>
              <p className="text-muted-foreground mt-2 text-sm font-sans">{selectedItem.description}</p>
              
              {selectedItem.modifiers && selectedItem.modifiers.length > 0 && (
                <div className="mt-6 space-y-4">
                  {selectedItem.modifiers.map((mod, modIdx) => (
                    <div key={modIdx} className="bg-foreground/5 border border-border/40 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-foreground font-heading">
                          {mod.name} {mod.required && <span className="text-destructive">*</span>}
                        </label>
                        <span className="text-[10px] bg-foreground/10 text-foreground px-2 py-0.5 rounded-full font-sans uppercase font-bold tracking-wider">
                          {mod.type === 'single' ? 'Select One' : 'Select Multiple'}
                        </span>
                      </div>
                      <div className="space-y-2 mt-2 font-sans text-sm">
                        {mod.options.map((opt, optIdx) => {
                          const isSelected = selectedModifiers.some(sm => sm.name === mod.name && sm.option === opt.name);
                          return (
                            <label key={optIdx} className="flex justify-between items-center cursor-pointer select-none p-2 rounded-xl hover:bg-foreground/5 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <input 
                                  type={mod.type === 'single' ? 'radio' : 'checkbox'} 
                                  name={`modifier-${modIdx}`}
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (mod.type === 'single') {
                                      handleSelectSingleModifier(mod.name, opt);
                                    } else {
                                      handleSelectMultipleModifier(mod.name, opt, e.target.checked);
                                    }
                                  }}
                                  className="w-4 h-4 border border-border text-foreground accent-foreground cursor-pointer focus:ring-0 focus:ring-offset-0"
                                />
                                <span className="text-foreground font-medium">{opt.name}</span>
                              </div>
                              {opt.price > 0 && <span className="text-xs text-muted-foreground font-bold font-sans">+₹{opt.price}</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6">
                <label className="block text-sm font-bold text-foreground mb-2 font-heading">Special Instructions</label>
                <textarea 
                  className="w-full bg-foreground/5 border border-border text-foreground rounded-xl p-3 text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all resize-none"
                  rows="3"
                  placeholder="e.g., Make it spicy, no onions..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                ></textarea>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-4 bg-foreground/5 rounded-full p-1.5 border border-border">
                  <button 
                    className="w-10 h-10 bg-background hover:bg-foreground/10 active:scale-95 rounded-full flex items-center justify-center shadow-sm text-foreground disabled:opacity-50 transition-all border border-border"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="font-bold w-4 text-center text-foreground">{quantity}</span>
                  <button 
                    className="w-10 h-10 bg-background hover:bg-foreground/10 active:scale-95 rounded-full flex items-center justify-center shadow-sm text-foreground transition-all border border-border"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                
                <Button className="rounded-full px-8 h-12 shadow-md shadow-foreground/10" onClick={handleAddToCart}>
                  Add Item • ₹{((selectedItem.price + selectedModifiers.reduce((acc, m) => acc + (m.price || 0), 0)) * quantity)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Style for hiding scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default CustomerMenu;
