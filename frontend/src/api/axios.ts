import axios from 'axios';

// Use GitHub Codespaces forwarded URL for backend
const api = axios.create({
  baseURL: 'https://special-waffle-qrq4756xgrghxq47-5000.app.github.dev/api',
});

// Automatically add the JWT token to every request from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;