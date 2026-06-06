import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try { if (localStorage.getItem('vb_token')) await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('vb_token'); localStorage.removeItem('vb_refresh'); localStorage.removeItem('vb_user');
    api.defaults.headers.common['Authorization'] = '';
    setUser(null);
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('vb_token');
      if (!token) { setLoading(false); return; }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch {
        const refresh = localStorage.getItem('vb_refresh');
        if (refresh) {
          try {
            const r = await api.post('/auth/refresh', { refreshToken: refresh });
            localStorage.setItem('vb_token', r.data.token); localStorage.setItem('vb_refresh', r.data.refreshToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
            const me = await api.get('/auth/me');
            setUser(me.data.user);
          } catch { logout(); }
        } else { logout(); }
      }
      setLoading(false);
    };
    init();
  }, [logout]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, refreshToken, user: u } = res.data;
    localStorage.setItem('vb_token', token); localStorage.setItem('vb_refresh', refreshToken); localStorage.setItem('vb_user', JSON.stringify(u));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, refreshToken, user: u } = res.data;
    localStorage.setItem('vb_token', token); localStorage.setItem('vb_refresh', refreshToken); localStorage.setItem('vb_user', JSON.stringify(u));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(u);
    return u;
  };

  const hasRole = (...roles) => user && roles.includes(user.role);

  return <AuthContext.Provider value={{ user, loading, login, logout, register, hasRole }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
