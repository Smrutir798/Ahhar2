import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '@/lib/axios';
import { AuthContext } from '../context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Effect to navigate after user is set
  useEffect(() => {
    if (user && pendingNavigation) {
      console.log('[Login] User state updated, navigating to:', pendingNavigation);
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [user, pendingNavigation, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log('[Login] Attempting login for:', email);
      const res = await axios.post('/auth/login', { email, password });
      console.log('[Login] Login response:', res.data);
      
      const user = res.data.user;
      const token = res.data.token;
      
      if (!token) {
        console.error('[Login] No token in response!');
        setError('Login failed: No token received');
        return;
      }
      
      console.log('[Login] Token received, calling login() function');
      login(user, token);
      
      // Determine navigation path
      let navigationPath = '/';
      if (user?.role === 'thinkdifferent') {
        navigationPath = '/thinkdifferent';
      } else if (['admin', 'owner'].includes(user?.role)) {
        navigationPath = '/executive-dashboard';
      } else if (user?.role === 'kitchen') {
        navigationPath = '/kitchen';
      } else if (user?.role === 'waiter') {
        navigationPath = '/waiter';
      }
      
      console.log('[Login] Will navigate to:', navigationPath);
      setPendingNavigation(navigationPath);
    } catch (err) {
      console.error('[Login] Error:', err);
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#fafafa] overflow-hidden relative">
      <Card className="w-full max-w-[400px] shadow-sm relative border border-border/40 bg-white px-8 py-10 rounded-3xl">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white font-bold text-2xl mb-5">
            A
          </div>
          <h1 className="text-[22px] font-bold text-foreground font-heading">Ahhar.Ai</h1>
          <p className="text-[15px] text-muted-foreground mt-1 font-sans">by ThinkDifferent</p>
        </div>
        
        <CardContent className="p-0">
          <form onSubmit={handleLogin} className="grid gap-5 font-sans">
            {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}
            
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-[11px] uppercase tracking-wider font-bold text-foreground">Email Address</Label>
              <Input id="email" type="email" placeholder="owner@thinkdifferent.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-lg border-border/60 bg-white shadow-sm" />
            </div>
            
            <div className="grid gap-1.5">
              <Label htmlFor="password" className="text-[11px] uppercase tracking-wider font-bold text-foreground">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-lg border-border/60 bg-white shadow-sm" />
            </div>
            
            <Button type="submit" className="w-full h-12 text-[15px] font-medium rounded-lg mt-3 bg-black text-white hover:bg-black/90 flex items-center justify-center gap-2">
              Sign In <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>

        <div className="mt-8 flex flex-col items-center gap-5 border-t border-border/40 pt-6 font-sans">
          <a href="https://think-different-hub.vercel.app/" className="inline-flex items-center justify-center w-full border border-dashed border-border/60 rounded-xl px-4 py-3 text-[13px] text-foreground hover:bg-muted/30 transition-colors">
            Are you a ThinkDifferent Member? <span className="font-bold ml-1">Login</span>
          </a>
        </div>
      </Card>
    </div>
  );
};

export default Login;
