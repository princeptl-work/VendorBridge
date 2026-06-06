import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Building2, ClipboardList, FileText, CheckSquare, ShoppingBag, Receipt, BarChart3, History, Users } from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, badge, end }) => (
  <NavLink to={to} end={end} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
    <span className="sidebar-item-icon" style={{ display:'flex', alignItems:'center', justifyContent:'center', color: 'var(--primary)' }}><Icon size={18} /></span>
    <span>{label}</span>
    {badge ? <span className="sidebar-item-badge">{badge}</span> : null}
  </NavLink>
);

const Sidebar = ({ pendingApprovals = 0 }) => {
  const { user, logout } = useAuth();
  const initials = n => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : 'U';
  const roleLabel = { admin:'Administrator', procurement_officer:'Procurement Officer', manager:'Manager', vendor:'Vendor' };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">VB</div>
        <div>
          <div className="sidebar-logo-text">VendorBridge</div>
          <span className="sidebar-logo-sub">Procurement ERP</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Main</div>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" end />
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">Procurement</div>
          {user?.role !== 'vendor' && <NavItem to="/vendors" icon={Building2} label="Vendors" />}
          <NavItem to="/rfqs" icon={ClipboardList} label="RFQs" />
          <NavItem to="/quotations" icon={FileText} label="Quotations" />
          {['admin','manager','procurement_officer'].includes(user?.role) && (
            <NavItem to="/approvals" icon={CheckSquare} label="Approvals" badge={pendingApprovals > 0 ? pendingApprovals : null} />
          )}
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">Orders</div>
          <NavItem to="/purchase-orders" icon={ShoppingBag} label="Purchase Orders" />
          <NavItem to="/invoices" icon={Receipt} label="Invoices" />
        </div>
        {['admin','manager'].includes(user?.role) && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Analytics</div>
            <NavItem to="/reports" icon={BarChart3} label="Reports" />
            <NavItem to="/activity-logs" icon={History} label="Activity Logs" />
          </div>
        )}
        {user?.role === 'admin' && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Admin</div>
            <NavItem to="/users" icon={Users} label="User Management" />
          </div>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials(user?.name)}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{roleLabel[user?.role] || user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
