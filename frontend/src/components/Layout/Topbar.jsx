import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Topbar = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title || 'VendorBridge'}</div>
        {subtitle && <div className="topbar-breadcrumb">{subtitle}</div>}
      </div>
      <div className="topbar-right">
        <button className="topbar-icon-btn" title="Notifications">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        <div style={{ position:'relative' }}>
          <button className="topbar-icon-btn" onClick={() => setOpen(v => !v)}
            style={{ padding:'0 12px', gap:8 }}>
            <div style={{ width:28, height:28, background:'var(--primary)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700, flexShrink:0 }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.name}
            </span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {open && (
            <>
              <div style={{ position:'fixed', inset:0, zIndex:199 }} onClick={() => setOpen(false)} />
              <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-md)', minWidth:200, zIndex:200, overflow:'hidden' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border-light)' }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{user?.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{user?.email}</div>
                  <div style={{ fontSize:11, color:'var(--primary)', fontWeight:600, marginTop:4, textTransform:'capitalize' }}>{user?.role?.replace('_',' ')}</div>
                </div>
                <div style={{ padding:8 }}>
                  <button onClick={handleLogout} style={{ width:'100%', textAlign:'left', padding:'9px 12px', background:'none', border:'none', cursor:'pointer', borderRadius:'var(--radius)', fontSize:13, color:'var(--danger)', fontWeight:600, display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--danger-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background='none'}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
