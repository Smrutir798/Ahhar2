import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '@/lib/axios';
import { AuthContext } from '../context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Effect to navigate after user is set
  useEffect(() => {
    if (user && pendingNavigation) {
      console.log('[Register] User state updated, navigating to:', pendingNavigation);
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [user, pendingNavigation, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/register', { name, email, password, role: 'thinkdifferent' });
      login(res.data.user, res.data.token);
      setPendingNavigation('/thinkdifferent');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background overflow-hidden relative transition-colors duration-300">
      {/* Background blobs for premium glassmorphism */}
      <div className="bg-blobs">
        <div className="bg-blob-1"></div>
        <div className="bg-blob-2"></div>
        <div className="bg-blob-3"></div>
      </div>
      
      <Card className="w-full max-w-sm z-10 shadow-2xl relative">
        <CardHeader>
          <CardTitle className="text-2xl font-heading">ThinkDifferent Registration</CardTitle>
          <CardDescription className="font-sans">Create a new platform administrator account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="grid gap-4 font-sans">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full font-heading">Create Account</Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full font-sans border-t border-border/40 pt-4 mt-1">
            Already registered? <Link to="/login" className="underline text-foreground font-bold hover:text-foreground/80 transition-colors">Login Here</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
