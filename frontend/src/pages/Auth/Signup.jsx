import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROLES = [
  { value:'admin', label:'Admin' },
  { value:'manager', label:'Manager / Approver' },
  { value:'procurement_officer', label:'Procurement Officer' },
  { value:'vendor', label:'Vendor' },
];

const Signup = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'', role:'procurement_officer', phone:'', department:'', companyName:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.role !== 'vendor' && !form.companyName) { setError('Company name is required'); return; }
    setError(''); setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone,
        department: form.department,
        company: form.role !== 'vendor' ? form.companyName : undefined
      });
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth:480 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div className="auth-logo-icon">VB</div>
          <div className="auth-logo-text">VendorBridge</div>
          <div className="auth-logo-sub">Create your account</div>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Full Name <span className="req">*</span></label>
              <input className="form-control" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role <span className="req">*</span></label>
              <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          {form.role !== 'vendor' && (
            <div className="form-group">
              <label className="form-label">Company Name <span className="req">*</span></label>
              <input className="form-control" placeholder="VendorBridge Corp" value={form.companyName} onChange={e => set('companyName', e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email Address <span className="req">*</span></label>
            <input className="form-control" type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" placeholder="+91 9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-control" placeholder="Procurement" value={form.department} onChange={e => set('department', e.target.value)} />
            </div>
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Password <span className="req">*</span></label>
              <input className="form-control" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password <span className="req">*</span></label>
              <input className="form-control" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%', marginTop:8 }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-link">
          Already have an account? <Link to="/login" style={{ color:'var(--primary)', fontWeight:600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
