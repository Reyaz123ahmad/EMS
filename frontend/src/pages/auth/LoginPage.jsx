import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import useAuthStore from '../../store/auth.store.js';
import authService from '../../services/auth.service.js';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email address is required';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Logged in successfully');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
      // For dev / mock preview if backend auth route is pending:
      if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
        toast.info('Dev Mode: Simulated sign-in available');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-white">Sign In to Your Portal</h2>
        <p className="text-xs text-slate-400">Enter your official credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="admin@mindstocs.com"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••••••"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
            />
            <span>Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
          <LogIn className="h-4 w-4 mr-1" />
          Sign In
        </Button>
      </form>
    </div>
  );
}

export default LoginPage;
