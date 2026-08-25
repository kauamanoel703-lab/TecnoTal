import axios from 'axios';

// API central: sempre com cookies (sessão HttpOnly)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

export default api;
