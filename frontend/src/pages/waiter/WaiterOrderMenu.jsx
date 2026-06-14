import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '@/lib/axios';
import { CartContext } from '../../context/CartContext';
import { Search, ShoppingBag, Plus, Minus, X, ArrowLeft, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const WaiterOrderMenu = () => {
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

        // 3. Check session or Create one
        const sessionRes = await axios.get(`/customer/session/${tableId}`);
        if (sessionRes.data) {
          setSession(sessionRes.data);
        } else {
          setSession(null);
        }
        
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

  const handleAddToCart = async () => {
    let currentSession = session;
    if (!currentSession) {
      try {
        const newSessionRes = await axios.post('/customer/session/create', {
          tableId,
          restaurantId: restaurant._id,
          customerName: `Table ${table.tableNumber} (Waiter)`,
          customerPhone: ''
        });
        currentSession = newSessionRes.data;
        setSession(currentSession);
      } catch (err) {
        console.error("Failed to create session", err);
        return;
      }
    }
    addToCart(selectedItem, quantity, instructions, selectedModifiers, currentSession);
    setSelectedItem(null);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading Menu...</div>;
  if (!table) return <div className="flex-1 flex items-center justify-center">Invalid Table</div>;

  return (
    <div className="flex flex-col flex-1 bg-gray-50 pb-24 font-sans text-black relative min-h-screen">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 sticky top-0 z-10 bg-gray-50">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/waiter/order')} className="p-1 -ml-1 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
              <ArrowLeft size={22} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-[22px] font-bold text-black leading-tight tracking-tight">{restaurant?.name || 'Xero'}</h1>
              <p className="text-[13px] text-gray-500 font-medium">Table {table?.tableNumber}</p>
            </div>
          </div>
          <button 
            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-black transition-colors"
            onClick={() => navigate(`/waiter/order/${tableId}/history`)}
          >
            <Receipt size={18} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search food..." 
            className="w-full bg-[#EBEBEB] text-black rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all placeholder:text-gray-500 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="border-b border-gray-100 overflow-x-auto whitespace-nowrap px-5 py-2 sticky top-[138px] z-10 bg-gray-50 hide-scrollbar flex gap-3">
        <button 
          className={`inline-block px-5 py-2 rounded-full text-[13px] font-bold transition-all ${activeCategory === 'All' ? 'bg-black text-white' : 'bg-[#EBEBEB] text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveCategory('All')}
        >
          All
        </button>
        {categories.map(cat => (
          <button 
            key={cat._id}
            className={`inline-block px-5 py-2 rounded-full text-[13px] font-bold transition-all ${activeCategory === cat._id ? 'bg-black text-white' : 'bg-[#EBEBEB] text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveCategory(cat._id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="p-5 flex flex-col gap-4">
        {filteredItems.map(item => (
          <div 
            key={item._id} 
            className="bg-white border border-gray-200/60 p-3 rounded-[20px] flex gap-4 cursor-pointer hover:shadow-sm transition-shadow shadow-sm"
            onClick={() => handleOpenItem(item)}
          >
            <div className="w-[88px] h-[88px] bg-gray-100 rounded-[16px] flex-shrink-0 overflow-hidden relative">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] text-center px-1 font-medium">No Image</div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between py-1 pr-1">
              <h3 className="font-bold text-black text-[15px] leading-tight">{item.name}</h3>
              
              <div className="flex justify-between items-end mt-auto">
                <span className="font-bold text-black text-[15px]">₹{item.price}</span>
                <button 
                  className="rounded-lg px-5 py-1.5 text-[13px] font-bold bg-black text-white hover:bg-gray-800 transition-colors active:scale-95"
                  onClick={async (e) => {
                    e.stopPropagation();
                    let currentSession = session;
                    if (!currentSession) {
                      try {
                        const newSessionRes = await axios.post('/customer/session/create', {
                          tableId,
                          restaurantId: restaurant._id,
                          customerName: `Table ${table.tableNumber} (Waiter)`,
                          customerPhone: ''
                        });
                        currentSession = newSessionRes.data;
                        setSession(currentSession);
                      } catch (err) {
                        return;
                      }
                    }
                    addToCart(item, 1, '', [], currentSession);
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center text-gray-400 mt-10 font-medium">No items found.</div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-5 flex justify-center z-20">
          <button 
            className="w-full max-w-sm bg-black text-white rounded-full p-4 font-bold flex justify-between items-center shadow-lg hover:bg-gray-900 active:scale-95 transition-all"
            onClick={() => navigate(`/waiter/order/${tableId}/cart`)}
          >
            <div className="flex items-center gap-3">
              <span className="bg-white text-black px-2.5 py-0.5 rounded-full text-sm font-black">{cartCount}</span>
              <span className="tracking-wide">Review Order</span>
            </div>
            <ShoppingBag size={20} />
          </button>
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom border-t border-gray-200">
            <div className="relative h-64 bg-gray-100 flex-shrink-0">
              {selectedItem.image && (
                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
              )}
              <button 
                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full backdrop-blur-md text-black shadow-sm active:scale-95 transition-all"
                onClick={() => setSelectedItem(null)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-auto bg-white">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-black">{selectedItem.name}</h2>
                <span className="text-xl font-bold text-black">₹{selectedItem.price}</span>
              </div>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed">{selectedItem.description}</p>
              
              {selectedItem.modifiers && selectedItem.modifiers.length > 0 && (
                <div className="mt-6 space-y-4">
                  {selectedItem.modifiers.map((mod, modIdx) => (
                    <div key={modIdx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-bold text-black">
                          {mod.name} {mod.required && <span className="text-red-500">*</span>}
                        </label>
                        <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                          {mod.type === 'single' ? 'Select One' : 'Select Multiple'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {mod.options.map((opt, optIdx) => {
                          const isSelected = selectedModifiers.some(sm => sm.name === mod.name && sm.option === opt.name);
                          return (
                            <label key={optIdx} className="flex justify-between items-center cursor-pointer select-none p-3 rounded-xl hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-black bg-black text-white' : 'border-gray-300'}`}>
                                  {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                <span className="text-black font-medium text-sm">{opt.name}</span>
                              </div>
                              {opt.price > 0 && <span className="text-sm text-gray-500 font-bold">+₹{opt.price}</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6">
                <label className="block text-sm font-bold text-black mb-2">Special Instructions</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-200 text-black rounded-xl p-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none placeholder:text-gray-400"
                  rows="3"
                  placeholder="e.g., Make it spicy, no onions..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                ></textarea>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 bg-gray-50 rounded-full p-1.5 border border-gray-200">
                  <button 
                    className="w-10 h-10 bg-white hover:bg-gray-100 active:scale-95 rounded-full flex items-center justify-center shadow-sm text-black disabled:opacity-50 transition-all border border-gray-100"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="font-bold w-4 text-center text-black">{quantity}</span>
                  <button 
                    className="w-10 h-10 bg-white hover:bg-gray-100 active:scale-95 rounded-full flex items-center justify-center shadow-sm text-black transition-all border border-gray-100"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                
                <button 
                  className="flex-1 rounded-full h-12 font-bold bg-black text-white hover:bg-gray-900 active:scale-95 transition-all shadow-md"
                  onClick={handleAddToCart}
                >
                  Add • ₹{((selectedItem.price + selectedModifiers.reduce((acc, m) => acc + (m.price || 0), 0)) * quantity)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default WaiterOrderMenu;
