import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Plus, Building2, User, Key, Mail, ShieldAlert, LogOut, CheckCircle, Phone, FileText, MapPin } from 'lucide-react';

const ThinkDifferentDashboard = () => {
  const { logout } = useContext(AuthContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    phone: '',
    gstNumber: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: ''
  });

  const fetchRestaurants = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/restaurant/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRestaurants(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/restaurant/add-restaurant', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('Restaurant and Owner account successfully provisioned!');
      setFormData({
        restaurantName: '',
        address: '',
        phone: '',
        gstNumber: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: ''
      });
      
      // Close modal after a delay and refresh list
      setTimeout(() => {
        setShowModal(false);
        setMessage('');
        fetchRestaurants();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Provisioning failed');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
      {/* Background blobs for premium glassmorphism */}
      <div className="bg-blobs">
        <div className="bg-blob-1 bg-amber-500/10"></div>
        <div className="bg-blob-2 bg-yellow-500/10"></div>
        <div className="bg-blob-3 bg-neutral-500/10"></div>
      </div>

      <div className="relative z-10 flex flex-col flex-1 h-screen overflow-hidden">
        {/* Header */}
        <header className="border-b border-border/20 bg-card/40 backdrop-blur-md px-6 py-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <Building2 className="text-foreground" size={28} />
            <h1 className="text-xl font-bold font-heading tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/50">
              ThinkDifferent Platform Portal
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs bg-foreground/10 text-foreground font-semibold px-3 py-1 rounded-xl">
              Platform Admin
            </span>
            <Button variant="outline" size="sm" onClick={logout} className="font-heading hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all duration-300">
              <LogOut size={16} className="mr-1.5" /> Logout
            </Button>
          </div>
        </header>

        {/* Dashboard Area */}
        <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold font-heading">Onboarded Restaurants</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage and provision active clients on the Ahhar platform.</p>
            </div>
            <Button onClick={() => setShowModal(true)} className="rounded-xl flex items-center gap-2 font-bold font-heading">
              <Plus size={18} /> Provision Restaurant
            </Button>
          </div>

          {error && !showModal && (
            <div className="bg-destructive/5 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-center gap-2">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-muted-foreground font-medium">Loading restaurants...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map(rest => (
                <Card key={rest._id} className="hover:border-foreground/30 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-heading text-lg">{rest.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 font-sans mt-1">
                      <MapPin size={12} className="text-muted-foreground" /> {rest.address || 'No address set'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 font-sans text-sm pb-5">
                    <div className="space-y-2 border-t border-border/40 pt-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User size={14} />
                        <span className="font-semibold text-foreground">{rest.ownerId?.name || 'Unknown Owner'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail size={14} />
                        <span>{rest.ownerId?.email || 'No email associated'}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground border-t border-dashed border-border/40 pt-3">
                      <span className="flex items-center gap-1"><Phone size={10} /> {rest.phone || '-'}</span>
                      <span className="flex items-center gap-1"><FileText size={10} /> GST: {rest.gstNumber || '-'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {restaurants.length === 0 && (
                <div className="col-span-full text-center py-16 bg-card/20 border border-border/40 rounded-3xl backdrop-blur-sm">
                  <Building2 size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">No restaurants onboarded yet. Click "Provision Restaurant" to add one.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-border/40">
            <CardHeader className="bg-foreground/5 border-b border-border/40 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-heading">Provision Restaurant</CardTitle>
                  <CardDescription className="font-sans">Configure restaurant details and owner admin credentials.</CardDescription>
                </div>
                <button onClick={() => setShowModal(false)} className="text-foreground/60 hover:text-foreground font-bold text-lg p-1">✕</button>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto font-sans">
                {error && (
                  <div className="bg-destructive/5 border border-destructive/20 text-destructive text-sm p-3 rounded-xl flex items-center gap-2">
                    <ShieldAlert size={16} /> {error}
                  </div>
                )}
                {message && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 text-sm p-3 rounded-xl flex items-center gap-2">
                    <CheckCircle size={16} /> {message}
                  </div>
                )}

                {/* Section 1: Restaurant Info */}
                <div className="space-y-4">
                  <h3 className="font-bold font-heading text-sm text-foreground uppercase tracking-wider border-b pb-1">1. Restaurant Details</h3>
                  <div className="grid gap-2">
                    <Label htmlFor="restaurantName">Restaurant Name</Label>
                    <Input id="restaurantName" name="restaurantName" required placeholder="e.g. Grand Bistro" value={formData.restaurantName} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" placeholder="123 Food Street, Downtown" value={formData.address} onChange={handleInputChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" placeholder="+91 98765 43210" value={formData.phone} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="gstNumber">GST Number</Label>
                      <Input id="gstNumber" name="gstNumber" placeholder="22AAAAA0000A1Z5" value={formData.gstNumber} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Owner Credentials */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-bold font-heading text-sm text-foreground uppercase tracking-wider border-b pb-1">2. Owner Admin Account</h3>
                  <div className="grid gap-2">
                    <Label htmlFor="ownerName">Owner Full Name</Label>
                    <Input id="ownerName" name="ownerName" required placeholder="e.g. Alex Johnson" value={formData.ownerName} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ownerEmail">Owner Email Address</Label>
                    <Input id="ownerEmail" name="ownerEmail" type="email" required placeholder="owner@restaurant.com" value={formData.ownerEmail} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ownerPassword">Initial Password</Label>
                    <Input id="ownerPassword" name="ownerPassword" type="password" required placeholder="••••••••" value={formData.ownerPassword} onChange={handleInputChange} />
                  </div>
                </div>
              </CardContent>
              <div className="bg-foreground/5 border-t border-border/40 p-4 flex justify-end gap-3 shrink-0">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" className="font-bold font-heading">Create & Onboard</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ThinkDifferentDashboard;
