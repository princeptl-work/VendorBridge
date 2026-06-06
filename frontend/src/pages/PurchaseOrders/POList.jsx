import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const POList = () => {
  const navigate = useNavigate();
  const [pos, setPOs] = useState([]);
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
      const res = await api.get(`/purchase-orders?${params}`);
      setPOs(res.data.purchaseOrders || []);
      setPagination(res.data.pagination || {});
    } catch { toast.error('Failed to load POs'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page, status, search]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Purchase Orders</div>
          <div className="page-subtitle">Manage all purchase orders</div>
        </div>
      </div>
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <span className="table-search-icon"><Search size={16} /></span>
            <input placeholder="Search PO number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="partially_delivered">Partially Delivered</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {loading ? <Loader /> : pos.length === 0 ? (
          <div className="table-empty"><div className="table-empty-icon" style={{ color: 'var(--primary)' }}><ShoppingBag size={48} /></div><div className="table-empty-text">No purchase orders found</div><div className="table-empty-sub">Purchase orders are generated from approved quotations</div></div>
        ) : (
          <table>
            <thead><tr><th>PO #</th><th>Vendor</th><th>RFQ</th><th>Sub Total</th><th>Tax (GST)</th><th>Grand Total</th><th>Delivery Date</th><th>Invoice</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {pos.map(po => (
                <tr key={po._id} style={{ cursor:'pointer' }} onClick={() => navigate(`/purchase-orders/${po._id}`)}>
                  <td><span style={{ fontWeight:700, color:'var(--primary)' }}>{po.poNumber}</span></td>
                  <td style={{ fontWeight:600 }}>{po.vendorId?.name}</td>
                  <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{po.rfqId?.rfqNumber || '—'}</td>
                  <td>₹{(po.subTotal||0).toLocaleString('en-IN')}</td>
                  <td>₹{(po.taxAmount||0).toLocaleString('en-IN')} ({po.taxRate}%)</td>
                  <td style={{ fontWeight:700 }}>₹{(po.grandTotal||0).toLocaleString('en-IN')}</td>
                  <td>{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('en-IN') : '—'}</td>
                  <td>{po.invoiceGenerated ? <span className="badge badge-success">Generated</span> : <span className="badge badge-secondary">Pending</span>}</td>
                  <td><Badge status={po.status} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/purchase-orders/${po._id}`)}>View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pagination.pages > 1 && (
          <div className="table-pagination">
            <span>Showing {pos.length} of {pagination.total}</span>
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

export default POList;
