import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div className="auth-logo-icon">VB</div>
          <div className="auth-logo-text">VendorBridge</div>
        </div>
        {sent ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ color: 'var(--primary)', marginBottom:16 }}><Mail size={48} /></div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Email Sent!</div>
            <p style={{ color:'var(--text-secondary)', fontSize:13.5 }}>We've sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.</p>
            <Link to="/login" className="btn btn-primary btn-lg" style={{ width:'100%', marginTop:24, display:'flex' }}>Back to Login</Link>
          </div>
        ) : (
          <>
            <div className="auth-title">Forgot Password?</div>
            <div className="auth-subtitle">Enter your email and we'll send you a reset link</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address <span className="req">*</span></label>
                <input className="form-control" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <div className="auth-link">
              <Link to="/login" style={{ color:'var(--primary)', fontWeight:600 }}>← Back to Login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
