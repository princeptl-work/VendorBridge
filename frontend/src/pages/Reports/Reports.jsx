import React, { useEffect, useState } from 'react';
import { Building2, ClipboardList, ShoppingBag, CircleDollarSign, Hourglass, LineChart, Download } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const fmt = n => n >= 10000000 ? `₹${(n/10000000).toFixed(2)}Cr` : n >= 100000 ? `₹${(n/100000).toFixed(2)}L` : `₹${(n||0).toLocaleString('en-IN')}`;

const Reports = () => {
  const [monthly, setMonthly] = useState([]);
  const [vendorStats, setVendorStats] = useState([]);
  const [procStats, setProcStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, v, p, o] = await Promise.all([
          api.get('/reports/monthly-spending'),
          api.get('/reports/vendor-performance'),
          api.get('/reports/procurement-stats'),
          api.get('/reports/overview')
        ]);
        setMonthly(m.data.monthlyData || []);
        setVendorStats(v.data.vendorStats || []);
        setProcStats(p.data);
        setOverview(o.data.stats);
      } catch { toast.error('Failed to load reports'); }
      setLoading(false);
    };
    load();
  }, []);

  const exportCSV = (data, filename) => {
    if (!data?.length) { toast.error('No data to export'); return; }
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  if (loading) return <Loader />;

  const lineData = {
    labels: monthly.map(m => m.label),
    datasets: [{ label: 'Spend (₹)', data: monthly.map(m => m.totalSpend), fill: true, backgroundColor: 'rgba(113,75,103,0.08)', borderColor: '#714b67', borderWidth: 2.5, pointBackgroundColor: '#714b67', tension: 0.4 }]
  };

  const barData = {
    labels: vendorStats.slice(0,8).map(v => v.vendorName || 'Unknown'),
    datasets: [{ label: 'Total Spend (₹)', data: vendorStats.slice(0,8).map(v => v.totalSpend), backgroundColor: ['#714b67','#875a7b','#a26c8d','#b87ea0','#cf91b3','#e0a9c9','#eedde9','#f3eef2'] }]
  };

  const doughnutData = procStats?.categorySpend?.length > 0 ? {
    labels: procStats.categorySpend.map(c => c._id || 'Other'),
    datasets: [{ data: procStats.categorySpend.map(c => c.totalSpend), backgroundColor: ['#714b67','#17a2b8','#28a745','#ffc107','#dc3545','#6f42c1','#e83e8c','#20c997','#fd7e14'] }]
  } : null;

  const chartOpts = { responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ₹${ctx.raw?.toLocaleString('en-IN')}` } } }, scales: { y: { beginAtZero: true, grid: { color: '#f0f0f0' } }, x: { grid: { display: false } } } };

  const statItems = [
    { label:'Total Vendors', value: overview?.totalVendors, icon:<Building2 size={24} />, color:'var(--primary)' },
    { label:'Total RFQs', value: overview?.totalRFQs, icon:<ClipboardList size={24} />, color:'var(--info)' },
    { label:'Total POs', value: overview?.totalPOs, icon:<ShoppingBag size={24} />, color:'var(--success)' },
    { label:'Paid Invoices', value: overview?.paidInvoices, icon:<CircleDollarSign size={24} />, color:'var(--success)' },
    { label:'Pending Approvals', value: overview?.pendingApprovals, icon:<Hourglass size={24} />, color:'var(--warning)' },
    { label:'Total Procurement', value: fmt(overview?.totalSpend), icon:<LineChart size={24} />, color:'var(--primary)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-subtitle">Procurement insights, vendor performance, and spending trends</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => exportCSV(monthly.map(m => ({ Month:m.label, 'Total Spend':m.totalSpend, 'Order Count':m.count })), 'monthly-spending.csv')} style={{ display:'flex', gap:6, alignItems:'center' }}>
            <Download size={16} /> Export Monthly CSV
          </button>
          <button className="btn btn-secondary" onClick={() => exportCSV(vendorStats.map(v => ({ Vendor:v.vendorName, Category:v.category, 'Total Orders':v.totalOrders, 'Total Spend':v.totalSpend, 'Fulfillment Rate':v.fulfillmentRate?.toFixed(1)+'%' })), 'vendor-performance.csv')} style={{ display:'flex', gap:6, alignItems:'center' }}>
            <Download size={16} /> Export Vendors CSV
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid-stat mb-24">
        {statItems.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background:'var(--primary-100)', fontSize:22 }}>{s.icon}</div>
            <div>
              <div className="stat-value" style={{ color:s.color }}>{s.value ?? '—'}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2 mb-24">
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ marginBottom:0 }}>Monthly Procurement Spend</div>
          </div>
          {monthly.some(m => m.totalSpend > 0) ? <Line data={lineData} options={chartOpts} height={140} /> : <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>No spending data yet</div>}
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ marginBottom:0 }}>Top Vendors by Spend</div>
          </div>
          {vendorStats.length > 0 ? <Bar data={barData} options={{...chartOpts, indexAxis:'y', plugins:{...chartOpts.plugins, legend:{display:false}}}} height={140} /> : <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>No data yet</div>}
        </div>
      </div>

      <div className="grid-2 mb-24">
        {doughnutData && (
          <div className="card">
            <div className="card-title">Spend by Category</div>
            <div style={{ maxWidth:280, margin:'0 auto' }}>
              <Doughnut data={doughnutData} options={{ responsive:true, plugins:{ legend:{ position:'bottom', labels:{ font:{ size:12 } } } } }} />
            </div>
          </div>
        )}
        <div className="card">
          <div className="card-title">Procurement Pipeline</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { label:'Draft RFQs', value: procStats?.rfqStats?.find(s=>s._id==='draft')?.count || 0, color:'var(--text-muted)' },
              { label:'Active RFQs', value: procStats?.rfqStats?.find(s=>s._id==='sent')?.count || 0, color:'var(--info)' },
              { label:'Pending Approvals', value: procStats?.approvalStats?.find(s=>s._id==='pending')?.count || 0, color:'var(--warning)' },
              { label:'Confirmed POs', value: procStats?.poStats?.find(s=>s._id==='confirmed')?.count || 0, color:'var(--success)' },
              { label:'Draft Invoices', value: procStats?.invoiceStats?.find(s=>s._id==='draft')?.count || 0, color:'var(--text-secondary)' },
              { label:'Paid Invoices', value: procStats?.invoiceStats?.find(s=>s._id==='paid')?.count || 0, color:'var(--success)' },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--bg-page)', borderRadius:'var(--radius)', border:'1px solid var(--border-light)' }}>
                <span style={{ fontSize:13.5, color:'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize:18, fontWeight:800, color:item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Performance Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{ marginBottom:0 }}>Vendor Performance Scorecard</div>
          <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(vendorStats.map(v => ({ Vendor:v.vendorName, Category:v.category, Rating:v.rating, 'Total Orders':v.totalOrders, 'Total Spend':v.totalSpend, 'Fulfillment Rate':v.fulfillmentRate?.toFixed(1)+'%' })), 'vendor-scorecard.csv')} style={{ display:'flex', gap:6, alignItems:'center' }}>
            <Download size={16} /> Export
          </button>
        </div>
        {vendorStats.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>No vendor data yet</div>
        ) : (
          <table>
            <thead><tr><th>#</th><th>Vendor</th><th>Category</th><th>Rating</th><th>Total Orders</th><th>Total Spend</th><th>Delivered</th><th>Fulfillment Rate</th></tr></thead>
            <tbody>
              {vendorStats.map((v, i) => (
                <tr key={i}>
                  <td style={{ fontWeight:700, color:'var(--primary)' }}>#{i+1}</td>
                  <td style={{ fontWeight:600 }}>{v.vendorName || 'Unknown'}</td>
                  <td><span style={{ fontSize:12, background:'var(--primary-100)', color:'var(--primary)', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{v.category}</span></td>
                  <td><span className="stars">{'★'.repeat(Math.round(v.rating||0))}{'☆'.repeat(5-Math.round(v.rating||0))}</span></td>
                  <td>{v.totalOrders}</td>
                  <td style={{ fontWeight:700 }}>{fmt(v.totalSpend)}</td>
                  <td>{v.deliveredOrders}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${v.fulfillmentRate||0}%`, height:'100%', background:`${v.fulfillmentRate>=80?'var(--success)':v.fulfillmentRate>=50?'var(--warning)':'var(--danger)'}`, borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:700 }}>{(v.fulfillmentRate||0).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;
