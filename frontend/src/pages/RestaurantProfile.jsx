import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const RestaurantProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    address: '',
    phone: '',
    gstNumber: '',
    logo: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/restaurant');
        if (res.data) setProfile(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.put('/restaurant', profile);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Restaurant Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Update your restaurant information here.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {message && <div className="text-sm font-medium text-green-600">{message}</div>}
            
            <div className="grid gap-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input id="name" name="name" value={profile.name} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={profile.address} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={profile.phone} onChange={handleChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input id="gstNumber" name="gstNumber" value={profile.gstNumber} onChange={handleChange} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" name="logo" type="url" placeholder="https://example.com/logo.png" value={profile.logo} onChange={handleChange} />
            </div>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantProfile;
