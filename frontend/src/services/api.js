import axios from 'axios';

const api = axios.create({ baseURL: 'https://vendorbridge-frontend-pi.vercel.app/api', headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(
  config => { const token = localStorage.getItem('vb_token'); if (token) config.headers['Authorization'] = `Bearer ${token}`; return config; },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  res => res,
  async error => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry && !orig.url?.includes('/auth/')) {
      orig._retry = true;
      const refreshToken = localStorage.getItem('vb_refresh');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          const { token, refreshToken: nr } = res.data;
          localStorage.setItem('vb_token', token); localStorage.setItem('vb_refresh', nr);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          orig.headers['Authorization'] = `Bearer ${token}`;
          return api(orig);
        } catch { localStorage.clear(); window.location.href = '/login'; }
      } else { localStorage.clear(); window.location.href = '/login'; }
    }
    return Promise.reject(error);
  }
);

export default api;
