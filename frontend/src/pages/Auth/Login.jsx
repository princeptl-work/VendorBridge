import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div className="auth-logo-icon">VB</div>
          <div className="auth-logo-text">VendorBridge</div>
          <div className="auth-logo-sub">Procurement & Vendor Management ERP</div>
        </div>
        <div className="auth-title">Welcome back</div>
        <div className="auth-subtitle">Sign in to your account to continue</div>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address <span className="req">*</span></label>
            <input className="form-control" type="email" placeholder="you@company.com" value={form.email}
              onChange={e => setForm(f => ({...f, email:e.target.value}))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password <span className="req">*</span></label>
            <input className="form-control" type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({...f, password:e.target.value}))} required />
          </div>
          <div style={{ textAlign:'right', marginBottom:16 }}>
            <Link to="/forgot-password" style={{ fontSize:13, color:'var(--primary)' }}>Forgot password?</Link>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-link">
          Don't have an account? <Link to="/signup" style={{ color:'var(--primary)', fontWeight:600 }}>Create account</Link>
        </div>
        <div style={{ marginTop:24, background:'var(--primary-100)', borderRadius:'var(--radius)', padding:'12px 16px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--primary)', marginBottom:6 }}>Demo Credentials</div>
          <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.8 }}>
            <strong>Admin:</strong> admin@vendorbridge.com / admin123<br/>
            <strong>Manager:</strong> manager@vendorbridge.com / manager123<br/>
            <strong>Officer:</strong> officer@vendorbridge.com / officer123<br/>
            <strong>Vendor:</strong> vendor@vendorbridge.com / vendor123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
