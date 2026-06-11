import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '@/lib/axios';
import { AuthContext } from '../context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', { email, password });
      const user = res.data.user;
      login(user, res.data.token);

      if (['admin', 'owner'].includes(user?.role)) {
        navigate('/executive-dashboard');
      } else if (user?.role === 'kitchen') {
        navigate('/kitchen');
      } else if (user?.role === 'waiter') {
        navigate('/waiter');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
          <CardTitle className="text-2xl font-heading">Login</CardTitle>
          <CardDescription className="font-sans">Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4 font-sans">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full font-heading">Sign in</Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full font-sans">
            Don't have an account? <Link to="/register" className="underline text-foreground">Register</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
