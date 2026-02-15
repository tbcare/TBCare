import axios from 'axios';

const api = axios.create({
  // Use relative path to leverage Vite proxy in dev mode
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Automatically add the JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;