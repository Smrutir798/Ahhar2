import React, { useState, useEffect, useContext } from 'react';
import axios from '@/lib/axios';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Percent, Save } from 'lucide-react';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [taxSettings, setTaxSettings] = useState({
    cgst: 2.5,
    sgst: 2.5,
    serviceCharge: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/restaurant');
        if (res.data?.taxSettings) {
          setTaxSettings(res.data.taxSettings);
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

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Restaurant Settings</h1>
      
      <div className="bg-white rounded-xl shadow-sm border p-6">
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
    </div>
  );
};

export default Settings;
