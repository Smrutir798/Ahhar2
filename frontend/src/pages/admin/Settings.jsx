import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Percent, Save, Wifi, Usb, CheckCircle, Store, MapPin } from 'lucide-react';
import { connectUSBPrinter } from '../../utils/printer';
import SubscriptionPlans from '../owner/SubscriptionPlans';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [taxSettings, setTaxSettings] = useState({
    cgst: 2.5,
    sgst: 2.5,
    serviceCharge: 0
  });
  const [restaurantDetails, setRestaurantDetails] = useState({
    name: '',
    address: '',
    phone: '',
    gstNumber: '',
    upiId: ''
  });
  const [geofence, setGeofence] = useState({
    enabled: false,
    latitude: '',
    longitude: '',
    radius: 50
  });
  const [networkIp, setNetworkIp] = useState('192.168.1.100');
  const [usbStatus, setUsbStatus] = useState('disconnected');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/restaurant');
        if (res.data) {
          if (res.data.taxSettings) {
            setTaxSettings(res.data.taxSettings);
          }
          setRestaurantDetails({
            name: res.data.name || '',
            address: res.data.address || '',
            phone: res.data.phone || '',
            gstNumber: res.data.gstNumber || '',
            upiId: res.data.upiId || ''
          });
          if (res.data.geofence) {
            setGeofence(res.data.geofence);
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/restaurant/${user.restaurantId}/taxes`, 
        { taxSettings },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Tax settings updated successfully!');
    } catch (err) {
      alert('Failed to update tax settings');
    }
  };

  const handleSaveDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/restaurant', 
        { ...restaurantDetails, geofence },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      window.dispatchEvent(new CustomEvent('restaurant-updated', { 
        detail: { name: restaurantDetails.name } 
      }));
      
      alert('Restaurant details updated successfully!');
    } catch (err) {
      alert('Failed to update restaurant details');
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeofence(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      },
      (error) => {
        alert('Failed to get location. Please ensure location permissions are granted.');
      }
    );
  };

  const handleSaveNetwork = () => {
    // In a real app, this would send the IP to the backend to save in DB/env
    alert(`Network printer IP ${networkIp} saved! (Note: Ensure this matches backend .env PRINTER_IP)`);
  };

  const handleConnectUSB = async () => {
    try {
      setUsbStatus('connecting');
      await connectUSBPrinter();
      setUsbStatus('connected');
    } catch (err) {
      setUsbStatus('disconnected');
      alert(err.message || 'Failed to connect to USB printer');
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="w-full max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Restaurant Settings</h1>
      
      {/* Restaurant Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Store className="text-primary" />
          <h2 className="text-lg font-bold">Restaurant Profile</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">Update your basic restaurant information.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
            <Input value={restaurantDetails.name} onChange={(e) => setRestaurantDetails({...restaurantDetails, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <Input value={restaurantDetails.phone} onChange={(e) => setRestaurantDetails({...restaurantDetails, phone: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <Input value={restaurantDetails.address} onChange={(e) => setRestaurantDetails({...restaurantDetails, address: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
            <Input value={restaurantDetails.gstNumber} onChange={(e) => setRestaurantDetails({...restaurantDetails, gstNumber: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (For Payments)</label>
            <Input value={restaurantDetails.upiId} onChange={(e) => setRestaurantDetails({...restaurantDetails, upiId: e.target.value})} />
          </div>
        </div>
        <div className="pt-4 mt-4 border-t flex justify-end">
          <Button onClick={handleSaveDetails}>
            <Save size={18} className="mr-2" /> Save Profile
          </Button>
        </div>
      </div>

      {/* Geofence Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="text-primary" />
          <h2 className="text-lg font-bold">Location & Geofencing</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">Restrict ordering to customers who are physically at your restaurant. Customers outside the radius will be blocked.</p>
        
        <div className="flex items-center justify-between mb-4 bg-gray-50 p-4 rounded-lg border">
          <div>
            <h3 className="font-medium text-gray-900">Enable Geofencing</h3>
            <p className="text-sm text-gray-500">Require GPS location to place orders</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={geofence.enabled}
              onChange={(e) => setGeofence({...geofence, enabled: e.target.checked})}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {geofence.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <Input 
                type="number" 
                value={geofence.latitude} 
                onChange={(e) => setGeofence({...geofence, latitude: e.target.value})} 
                placeholder="e.g. 19.0760" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <Input 
                type="number" 
                value={geofence.longitude} 
                onChange={(e) => setGeofence({...geofence, longitude: e.target.value})} 
                placeholder="e.g. 72.8777" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Radius (Meters)</label>
              <Input 
                type="number" 
                value={geofence.radius} 
                onChange={(e) => setGeofence({...geofence, radius: parseInt(e.target.value) || 0})} 
                placeholder="e.g. 50" 
              />
            </div>
            <div className="md:col-span-3 mt-2">
              <Button type="button" variant="outline" onClick={handleGetCurrentLocation} className="w-full">
                <MapPin size={16} className="mr-2"/> Use My Current Location
              </Button>
            </div>
          </div>
        )}
        <div className="pt-4 mt-4 border-t flex justify-end">
          <Button onClick={handleSaveDetails}>
            <Save size={18} className="mr-2" /> Save Geofence
          </Button>
        </div>
      </div>
      
      {/* Subscription Plans Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
         <SubscriptionPlans />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax Settings Column */}
        <div className="bg-white rounded-xl shadow-sm border p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="text-primary" />
          <h2 className="text-lg font-bold">Tax & Billing Configuration</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">Configure the default tax percentages that will be applied to customer bills.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CGST (%)</label>
            <Input 
              type="number" 
              step="0.1"
              value={taxSettings.cgst} 
              onChange={(e) => setTaxSettings({...taxSettings, cgst: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SGST (%)</label>
            <Input 
              type="number" 
              step="0.1"
              value={taxSettings.sgst} 
              onChange={(e) => setTaxSettings({...taxSettings, sgst: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (%)</label>
            <Input 
              type="number" 
              step="0.1"
              value={taxSettings.serviceCharge} 
              onChange={(e) => setTaxSettings({...taxSettings, serviceCharge: parseFloat(e.target.value) || 0})}
            />
          </div>
          
          <div className="pt-4 mt-4 border-t">
            <Button onClick={handleSave} className="w-full sm:w-auto">
              <Save size={18} className="mr-2" /> Save Configuration
            </Button>
          </div>
        </div>
      </div>

      {/* Printer Settings Column */}
      <div className="space-y-6 h-fit">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="text-primary" />
          <h2 className="text-lg font-bold">Network / WiFi Printer</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Connect via IP address (Backend routing). Usually used for Kitchen Display Printers. Ensure the backend server and printer are on the same WiFi network.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Printer IP Address</label>
            <div className="flex gap-2">
              <Input 
                type="text" 
                value={networkIp}
                onChange={(e) => setNetworkIp(e.target.value)}
                placeholder="e.g. 192.168.1.100"
              />
              <Button onClick={handleSaveNetwork}><Save size={16} className="mr-2"/> Save IP</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Usb className="text-primary" />
          <h2 className="text-lg font-bold">Direct USB Printer</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Connect directly to a USB POS printer. Requires Google Chrome, Edge, or Brave. Click below and select your printer from the popup dialog.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${usbStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="font-medium text-sm">
                {usbStatus === 'connected' ? 'Connected & Ready' : 'Disconnected'}
              </span>
            </div>
            <Button 
              onClick={handleConnectUSB} 
              disabled={usbStatus === 'connected'}
              variant={usbStatus === 'connected' ? 'outline' : 'primary'}
            >
              {usbStatus === 'connected' ? <CheckCircle size={16} className="mr-2"/> : <Usb size={16} className="mr-2"/>}
              {usbStatus === 'connected' ? 'Connected' : 'Connect USB Printer'}
            </Button>
          </div>
        </div>
      </div>
      
      </div>
      </div>
    </div>
  );
};

export default Settings;
