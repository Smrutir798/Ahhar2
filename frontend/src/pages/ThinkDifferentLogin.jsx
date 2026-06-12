import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '@/lib/axios';
import { AuthContext } from '../context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { ShieldAlert } from 'lucide-react';

const ThinkDifferentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Effect to navigate after user is set
  useEffect(() => {
    if (user && pendingNavigation) {
      console.log('[ThinkDifferentLogin] User state updated, navigating to:', pendingNavigation);
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [user, pendingNavigation, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/auth/login', { email, password });
      const user = res.data.user;

      if (user?.role !== 'thinkdifferent') {
        setError('Access Denied. Only ThinkDifferent Members can log in here.');
        return;
      }

      login(user, res.data.token);
      setPendingNavigation('/thinkdifferent');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background overflow-hidden relative transition-colors duration-300">
      {/* Background blobs for premium gold glassmorphism */}
      <div className="bg-blobs">
        <div className="bg-blob-1 bg-amber-500/10"></div>
        <div className="bg-blob-2 bg-yellow-500/10"></div>
        <div className="bg-blob-3 bg-neutral-500/10"></div>
      </div>
      
      <Card className="w-full max-w-sm z-10 shadow-2xl relative border-amber-500/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-3">
            <span className="text-amber-500 font-bold font-heading text-lg">TD</span>
          </div>
          <CardTitle className="text-2xl font-heading text-amber-500">ThinkDifferent Login</CardTitle>
          <CardDescription className="font-sans">Enter credentials to access the platform administrator portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4 font-sans">
            {error && (
              <div className="bg-destructive/5 border border-destructive/20 text-destructive text-sm p-3 rounded-xl flex items-center gap-2">
                <ShieldAlert size={16} />
                <span className="flex-1 text-xs">{error}</span>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full font-heading bg-amber-600 hover:bg-amber-700 text-white">Sign in</Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="text-xs text-center w-full font-sans border-t border-border/40 pt-4 mt-1">
            Not a member? <Link to="/register" className="underline text-foreground font-bold hover:text-foreground/80">Register Here</Link>
          </div>
          <div className="text-xs text-center w-full font-sans">
            Go back to <Link to="/login" className="underline text-foreground">Staff Login</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ThinkDifferentLogin;
