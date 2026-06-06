import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Search } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:10 });
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      const res = await api.get(`/invoices?${params}`);
      setInvoices(res.data.invoices || []);
      setPagination(res.data.pagination || {});
    } catch { toast.error('Failed to load invoices'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page, status, search]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Invoices</div>
          <div className="page-subtitle">View and manage all invoices</div>
        </div>
      </div>
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <span className="table-search-icon"><Search size={16} /></span>
            <input placeholder="Search invoice number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        {loading ? <Loader /> : invoices.length === 0 ? (
          <div className="table-empty"><div className="table-empty-icon" style={{ color: 'var(--primary)' }}><Receipt size={48} /></div><div className="table-empty-text">No invoices found</div><div className="table-empty-sub">Invoices are generated from purchase orders</div></div>
        ) : (
          <table>
            <thead><tr><th>Invoice #</th><th>Vendor</th><th>PO Reference</th><th>Grand Total</th><th>Due Date</th><th>Sent To</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id} style={{ cursor:'pointer' }} onClick={() => navigate(`/invoices/${inv._id}`)}>
                  <td><span style={{ fontWeight:700, color:'var(--primary)' }}>{inv.invoiceNumber}</span></td>
                  <td style={{ fontWeight:600 }}>{inv.vendorId?.name}</td>
                  <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{inv.poId?.poNumber || '—'}</td>
                  <td style={{ fontWeight:700 }}>₹{(inv.grandTotal||0).toLocaleString('en-IN')}</td>
                  <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{inv.sentTo || '—'}</td>
                  <td><Badge status={inv.status} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/invoices/${inv._id}`)}>View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pagination.pages > 1 && (
          <div className="table-pagination">
            <span>Showing {invoices.length} of {pagination.total}</span>
            <div className="pagination-btns">
              <button className="pg-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
              <button className="pg-btn" disabled={page===pagination.pages} onClick={() => setPage(p=>p+1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;
