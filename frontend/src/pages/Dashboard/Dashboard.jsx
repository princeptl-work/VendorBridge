import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Building2, ClipboardList, CheckSquare, ShoppingBag, Receipt, CircleDollarSign, BarChart3, FileText } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const StatCard = ({ icon, label, value, color, sub, link }) => (
  <Link to={link || '#'} style={{ textDecoration:'none' }}>
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {sub && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{sub}</div>}
      </div>
    </div>
  </Link>
);

const fmt = n => n >= 10000000 ? `₹${(n/10000000).toFixed(1)}Cr` : n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${(n||0).toLocaleString('en-IN')}`;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentPOs, setRecentPOs] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, po, inv, m] = await Promise.all([
          api.get('/reports/overview'),
          api.get('/purchase-orders?limit=5'),
          api.get('/invoices?limit=5'),
          api.get('/reports/monthly-spending')
        ]);
        setStats(s.data.stats);
        setRecentPOs(po.data.purchaseOrders || []);
        setRecentInvoices(inv.data.invoices || []);
        setMonthly(m.data.monthlyData || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Loader />;

  const lineData = {
    labels: monthly.map(m => m.label),
    datasets: [{
      label: 'Monthly Spend (₹)',
      data: monthly.map(m => m.totalSpend),
      fill: true,
      backgroundColor: 'rgba(113,75,103,0.08)',
      borderColor: '#714b67',
      borderWidth: 2,
      pointBackgroundColor: '#714b67',
      pointRadius: 4,
      tension: 0.4
    }]
  };

  const chartOpts = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f0f0f0' } }, x: { grid: { display: false } } } };

  return (
    <div>
      {/* Welcome banner */}
      <div style={{ background:'linear-gradient(135deg,#714b67,#875a7b)', borderRadius:'var(--radius-lg)', padding:'24px 28px', marginBottom:24, color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>Good morning, {user?.name?.split(' ')[0]}!</div>
          <div style={{ opacity:.85, fontSize:13.5 }}>Here's your procurement overview for today</div>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {['admin','procurement_officer'].includes(user?.role) && (
            <Link to="/rfqs/new" className="btn" style={{ background:'#fff', color:'var(--primary)', fontWeight:700 }}>+ New RFQ</Link>
          )}
          {['admin','procurement_officer'].includes(user?.role) && (
            <Link to="/vendors/new" className="btn" style={{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)' }}>+ Add Vendor</Link>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-stat mb-24">
        <StatCard icon={<Building2 size={24} />} label="Total Vendors" value={stats?.totalVendors} color="purple" sub={`${stats?.activeVendors} active`} link="/vendors" />
        <StatCard icon={<ClipboardList size={24} />} label="Active RFQs" value={stats?.activeRFQs} color="blue" sub={`${stats?.totalRFQs} total`} link="/rfqs" />
        <StatCard icon={<CheckSquare size={24} />} label="Pending Approvals" value={stats?.pendingApprovals} color="orange" sub="Awaiting review" link="/approvals" />
        <StatCard icon={<ShoppingBag size={24} />} label="Purchase Orders" value={stats?.totalPOs} color="green" sub="All time" link="/purchase-orders" />
        <StatCard icon={<Receipt size={24} />} label="Total Invoices" value={stats?.totalInvoices} color="purple" sub={`${stats?.paidInvoices} paid`} link="/invoices" />
        <StatCard icon={<CircleDollarSign size={24} />} label="Total Procurement" value={fmt(stats?.totalSpend)} color="green" sub="All confirmed POs" link="/reports" />
      </div>

      {/* Charts + Recent */}
      <div className="grid-2 mb-24">
        <div className="card">
          <div className="card-title">Monthly Procurement Trend</div>
          {monthly.length > 0 ? <Line data={lineData} options={chartOpts} height={120} /> : <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>No data yet</div>}
        </div>
        <div className="card">
          <div className="card-title">Quick Actions</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { icon:ClipboardList, label:'Create RFQ', link:'/rfqs/new', role:['admin','procurement_officer'] },
              { icon:Building2, label:'Add Vendor', link:'/vendors/new', role:['admin','procurement_officer'] },
              { icon:CheckSquare, label:'View Approvals', link:'/approvals', role:['admin','manager','procurement_officer'] },
              { icon:BarChart3, label:'View Reports', link:'/reports', role:['admin','manager'] },
              { icon:Receipt, label:'View Invoices', link:'/invoices', role:null },
              { icon:FileText, label:'Quotations', link:'/quotations', role:null },
            ].filter(a => !a.role || a.role.includes(user?.role)).map(a => {
              const Icon = a.icon;
              return (
                <Link key={a.link} to={a.link} style={{ textDecoration:'none' }}>
                  <div style={{ background:'var(--primary-100)', borderRadius:'var(--radius)', padding:'16px 14px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', transition:'var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--primary-200)'}
                    onMouseLeave={e => e.currentTarget.style.background='var(--primary-100)'}>
                    <span style={{ display:'flex', color:'var(--primary)' }}><Icon size={22} /></span>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--primary)' }}>{a.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ marginBottom:0 }}>Recent Purchase Orders</div>
            <Link to="/purchase-orders" style={{ fontSize:12.5, color:'var(--primary)', fontWeight:600 }}>View All →</Link>
          </div>
          {recentPOs.length === 0 ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text-muted)', fontSize:13 }}>No purchase orders yet</div> :
          <table><thead><tr><th>PO #</th><th>Vendor</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {recentPOs.map(po => (
              <tr key={po._id} style={{ cursor:'pointer' }} onClick={() => navigate(`/purchase-orders/${po._id}`)}>
                <td><span style={{ fontWeight:600, color:'var(--primary)' }}>{po.poNumber}</span></td>
                <td>{po.vendorId?.name || '—'}</td>
                <td style={{ fontWeight:600 }}>₹{(po.grandTotal||0).toLocaleString('en-IN')}</td>
                <td><Badge status={po.status} /></td>
              </tr>
            ))}
          </tbody></table>}
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ marginBottom:0 }}>Recent Invoices</div>
            <Link to="/invoices" style={{ fontSize:12.5, color:'var(--primary)', fontWeight:600 }}>View All →</Link>
          </div>
          {recentInvoices.length === 0 ? <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text-muted)', fontSize:13 }}>No invoices yet</div> :
          <table><thead><tr><th>Invoice #</th><th>Vendor</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {recentInvoices.map(inv => (
              <tr key={inv._id} style={{ cursor:'pointer' }} onClick={() => navigate(`/invoices/${inv._id}`)}>
                <td><span style={{ fontWeight:600, color:'var(--primary)' }}>{inv.invoiceNumber}</span></td>
                <td>{inv.vendorId?.name || '—'}</td>
                <td style={{ fontWeight:600 }}>₹{(inv.grandTotal||0).toLocaleString('en-IN')}</td>
                <td><Badge status={inv.status} /></td>
              </tr>
            ))}
          </tbody></table>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
