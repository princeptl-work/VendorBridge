import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TITLES = {
  '/': { title:'Dashboard', subtitle:'Procurement Overview' },
  '/vendors': { title:'Vendor Management', subtitle:'Manage vendor database' },
  '/vendors/new': { title:'Add Vendor', subtitle:'Register a new vendor' },
  '/rfqs': { title:'Request for Quotations', subtitle:'Manage procurement requests' },
  '/rfqs/new': { title:'Create RFQ', subtitle:'Initiate a new procurement request' },
  '/quotations': { title:'Quotations', subtitle:'View vendor quotations' },
  '/approvals': { title:'Approval Workflow', subtitle:'Review and approve procurement requests' },
  '/purchase-orders': { title:'Purchase Orders', subtitle:'Manage purchase orders' },
  '/invoices': { title:'Invoices', subtitle:'View and manage invoices' },
  '/activity-logs': { title:'Activity Logs', subtitle:'Procurement audit trail' },
  '/reports': { title:'Reports & Analytics', subtitle:'Procurement insights and trends' },
  '/users': { title:'User Management', subtitle:'Manage system users' },
};

const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState(0);

  const path = Object.keys(TITLES).find(k => location.pathname === k || (k !== '/' && location.pathname.startsWith(k)));
  const pageInfo = TITLES[path] || { title:'VendorBridge', subtitle:'' };

  useEffect(() => {
    if (['admin','manager','procurement_officer'].includes(user?.role)) {
      api.get('/approvals?status=pending&limit=1').then(r => setPendingApprovals(r.data?.pagination?.total || 0)).catch(() => {});
    }
  }, [location.pathname, user]);

  return (
    <div className="app-container">
      <Sidebar pendingApprovals={pendingApprovals} />
      <div className="main-content">
        <Topbar title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="page-wrapper">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
