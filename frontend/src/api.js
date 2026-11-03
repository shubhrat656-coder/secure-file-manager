import axios from 'axios';

// In dev, VITE_API_URL is empty and requests go to /api (proxied by Vite).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach the JWT to every request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
