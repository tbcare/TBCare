import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Activity, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Cleanup: Clear any existing session data when the login page loads
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // API call using the axios instance that points to localhost:5000/api
      const response = await api.post('/auth/login', { email, password });
      
      // Store the JWT token for authentication
      localStorage.setItem('token', response.data.token);
      
      // Store user object (ID and FacilityID are needed for adding patients)
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login Error:', err);
      
      // Handle different types of failures
      if (err.code === 'ERR_NETWORK') {
        setError('Connection Refused: Is the backend server running on port 5000?');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password.');
      } else if (err.response?.status === 404) {
        setError('Login endpoint not found. Check your API URL.');
      } else {
        setError(err.response?.data?.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl mb-4 shadow-lg shadow-blue-200">
            <Activity className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">TBCare</h1>
          <p className="text-slate-500 text-center text-sm">Tuberculosis Case Management System</p>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                placeholder="staff@tbcare.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-md mt-2 ${
              isLoading 
                ? 'bg-blue-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98] hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <><Loader2 className="animate-spin" size={20} /> Authenticating...</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer info for local debugging */}
        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <p className="text-xs text-slate-400 italic">
            Connected to: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;