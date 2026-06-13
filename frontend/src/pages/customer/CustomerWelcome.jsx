import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

const CustomerWelcome = ({ restaurantName, tableNumber, onSubmit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Please enter both your name and phone number.");
      return;
    }
    // Simple phone number validation (just checking if it has digits and length)
    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
    if (!phoneRegex.test(phone)) {
      alert("Please enter a valid phone number.");
      return;
    }
    onSubmit(name, phone);
  };

  return (
    <div className="flex flex-col flex-1 h-full items-center justify-center p-6 bg-background relative z-10 animate-in fade-in duration-500">
      <div className="w-full max-w-sm bg-card/60 backdrop-blur-2xl border border-border/60 p-8 rounded-3xl shadow-xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <span className="text-3xl">🍽️</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground mb-2">Welcome to {restaurantName || 'Our Restaurant'}</h1>
          <p className="text-sm text-muted-foreground font-sans">You are seated at Table {tableNumber}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5 font-heading">Your Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g., John Doe" 
              className="w-full bg-foreground/5 border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:bg-foreground/10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5 font-heading">Phone Number</label>
            <input 
              type="tel" 
              required
              placeholder="e.g., 9876543210" 
              className="w-full bg-foreground/5 border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:bg-foreground/10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-300"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full rounded-xl py-3 mt-4 h-12 shadow-lg shadow-primary/20 text-base font-bold">
            View Menu
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CustomerWelcome;
