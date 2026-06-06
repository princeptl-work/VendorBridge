import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ClipboardList, Eye, Edit, Trash2, Send } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const RFQList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rfqs, setRFQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:10 });
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      const res = await api.get(`/rfqs?${params}`);
      setRFQs(res.data.rfqs || []);
      setPagination(res.data.pagination || {});
    } catch { toast.error('Failed to load RFQs'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page, search, status]);

  const handleDelete = async (rfq) => {
    if (!window.confirm(`Delete RFQ "${rfq.title}"?`)) return;
    try { await api.delete(`/rfqs/${rfq._id}`); toast.success('RFQ deleted'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete'); }
  };

  const handleSend = async (rfq) => {
    try { await api.patch(`/rfqs/${rfq._id}/send`); toast.success('RFQ sent to vendors!'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Request for Quotations</div>
          <div className="page-subtitle">Create and manage procurement requests</div>
        </div>
        <div className="page-actions">
          {['admin','procurement_officer'].includes(user?.role) && (
            <Link to="/rfqs/new" className="btn btn-primary">+ Create RFQ</Link>
          )}
        </div>
      </div>
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <span className="table-search-icon"><Search size={16} /></span>
            <input placeholder="Search RFQs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="table-filters">
            <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        {loading ? <Loader /> : rfqs.length === 0 ? (
          <div className="table-empty">
            <div className="table-empty-icon" style={{ color: 'var(--primary)' }}><ClipboardList size={48} /></div>
            <div className="table-empty-text">No RFQs found</div>
            <div className="table-empty-sub">Create your first RFQ to start procurement</div>
          </div>
        ) : (
          <table>
            <thead><tr><th>RFQ #</th><th>Title</th><th>Vendors</th><th>Items</th><th>Deadline</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rfqs.map(rfq => (
                <tr key={rfq._id} style={{ cursor:'pointer' }} onClick={() => navigate(`/rfqs/${rfq._id}`)}>
                  <td><span style={{ fontWeight:700, color:'var(--primary)' }}>{rfq.rfqNumber}</span></td>
                  <td>
                    <div style={{ fontWeight:600 }}>{rfq.title}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>By {rfq.createdBy?.name}</div>
                  </td>
                  <td>{rfq.vendors?.length || 0} vendor(s)</td>
                  <td>{rfq.items?.length || 0} item(s)</td>
                  <td style={{ fontSize:13 }}>{new Date(rfq.deadline).toLocaleDateString('en-IN')}</td>
                  <td><Badge status={rfq.priority} /></td>
                  <td><Badge status={rfq.status} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="td-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/rfqs/${rfq._id}`)}><Eye size={16} /></button>
                      {rfq.status === 'draft' && ['admin','procurement_officer'].includes(user?.role) && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/rfqs/${rfq._id}/edit`)}><Edit size={16} /></button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleSend(rfq)}><Send size={16} /></button>
                          <button className="btn btn-ghost btn-sm" style={{ color:'var(--danger)' }} onClick={() => handleDelete(rfq)}><Trash2 size={16} /></button>
                        </>
                      )}
                      {rfq.status === 'sent' && ['admin','procurement_officer','manager'].includes(user?.role) && (
                        <Link to={`/rfqs/${rfq._id}/compare`} className="btn btn-secondary btn-sm">Compare</Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pagination.pages > 1 && (
          <div className="table-pagination">
            <span>Showing {rfqs.length} of {pagination.total}</span>
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

export default RFQList;
