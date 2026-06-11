import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '@/lib/axios';
import { CartContext } from '../../context/CartContext';
import { Search, ShoppingBag, Plus, Minus, X, ReceiptText } from 'lucide-react';
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
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenItem = (item) => {
    setSelectedItem(item);
    setQuantity(1);
    setInstructions('');
  };

  const handleAddToCart = () => {
    addToCart(selectedItem, quantity, instructions);
    setSelectedItem(null);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading Menu...</div>;
  if (!table) return <div className="flex-1 flex items-center justify-center">Invalid Table QR Code</div>;

  return (
    <div className="flex flex-col flex-1 bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{restaurant?.name}</h1>
            <p className="text-sm text-gray-500 font-medium">Table {table?.tableNumber}</p>
          </div>
          <button 
            className="p-2 bg-gray-100 rounded-full text-gray-700 relative flex items-center gap-2"
            onClick={() => navigate(`/menu/table/${tableId}/history`)}
          >
            <ReceiptText size={20} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search food..." 
            className="w-full bg-gray-100 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b overflow-x-auto whitespace-nowrap px-4 py-3 sticky top-[110px] z-10 hide-scrollbar">
        <button 
          className={`inline-block px-5 py-2 rounded-full text-sm font-medium mr-2 transition-colors ${activeCategory === 'All' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setActiveCategory('All')}
        >
          All
        </button>
        {categories.map(cat => (
          <button 
            key={cat._id}
            className={`inline-block px-5 py-2 rounded-full text-sm font-medium mr-2 transition-colors ${activeCategory === cat._id ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setActiveCategory(cat._id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="p-4 flex flex-col gap-4">
        {filteredItems.map(item => (
          <div key={item._id} className="bg-white p-3 rounded-2xl shadow-sm flex gap-4 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => handleOpenItem(item)}>
            <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center px-1">No Image</div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-primary">₹{item.price}</span>
                <button 
                  className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold active:bg-primary/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item, 1, '');
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center text-gray-500 mt-10">No items found.</div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-20">
          <button 
            className="w-full max-w-sm bg-primary text-white rounded-full p-4 font-bold flex justify-between items-center shadow-lg shadow-primary/30"
            onClick={() => navigate(`/menu/table/${tableId}/cart`)}
          >
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{cartCount}</span>
              <span>View Cart</span>
            </div>
            <ShoppingBag size={20} />
          </button>
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <div className="relative h-56 bg-gray-200 flex-shrink-0">
              {selectedItem.image && (
                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
              )}
              <button 
                className="absolute top-4 right-4 bg-white/80 p-2 rounded-full backdrop-blur-sm"
                onClick={() => setSelectedItem(null)}
              >
                <X size={20} className="text-gray-900" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-auto">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                <span className="text-xl font-bold text-primary">₹{selectedItem.price}</span>
              </div>
              <p className="text-gray-500 mt-2 text-sm">{selectedItem.description}</p>
              
              <div className="mt-6">
                <label className="block text-sm font-bold text-gray-900 mb-2">Special Instructions</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  rows="3"
                  placeholder="e.g., Make it spicy, no onions..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                ></textarea>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-4 bg-gray-100 rounded-full p-1.5">
                  <button 
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-900 disabled:opacity-50"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="font-bold w-4 text-center">{quantity}</span>
                  <button 
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-900"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                
                <Button className="rounded-full px-8 h-12 bg-primary text-white shadow-md shadow-primary/20" onClick={handleAddToCart}>
                  Add Item • ₹{selectedItem.price * quantity}
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
