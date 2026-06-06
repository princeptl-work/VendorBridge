import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Edit, Search } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const QuotationList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (status) params.append('status', status);
      const res = await api.get(`/quotations?${params}`);
      setQuotations(res.data.quotations || []);
      setPagination(res.data.pagination || {});
    } catch { toast.error('Failed to load quotations'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page, status]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quotations</div>
          <div className="page-subtitle">View and manage vendor quotations</div>
        </div>
      </div>
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <span className="table-search-icon"><Search size={16} /></span>
            <input placeholder="Search..." readOnly style={{ cursor:'default' }} />
          </div>
          <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {loading ? <Loader /> : quotations.length === 0 ? (
          <div className="table-empty"><div className="table-empty-icon" style={{ color: 'var(--primary)' }}><FileText size={48} /></div><div className="table-empty-text">No quotations found</div></div>
        ) : (
          <table>
            <thead><tr><th>RFQ</th><th>Vendor</th><th>Total Amount</th><th>Delivery</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q._id}>
                  <td>
                    <div style={{ fontWeight:600, color:'var(--primary)' }}>{q.rfqId?.rfqNumber}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{q.rfqId?.title}</div>
                  </td>
                  <td style={{ fontWeight:600 }}>{q.vendorId?.name}</td>
                  <td style={{ fontWeight:700, color:'var(--primary)' }}>₹{q.totalAmount.toLocaleString('en-IN')}</td>
                  <td>{q.deliveryTimeline} days</td>
                  <td><Badge status={q.status} /></td>
                  <td>{new Date(q.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div className="td-actions">
                      {q.status === 'submitted' && user?.role === 'vendor' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/quotations/${q._id}/edit`)} style={{ display:'flex', gap:6, alignItems:'center' }}><Edit size={16} /> Edit</button>
                      )}
                      {['admin','procurement_officer','manager'].includes(user?.role) && q.rfqId && (
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/rfqs/${q.rfqId._id}/compare`)}>Compare</button>
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
            <span>Showing {quotations.length} of {pagination.total}</span>
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

export default QuotationList;
