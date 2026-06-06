import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Edit, Send, BarChart3, FileText } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const RFQDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rfq, setRFQ] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [r, q] = await Promise.all([api.get(`/rfqs/${id}`), api.get(`/rfqs/${id}/quotations`)]);
      setRFQ(r.data.rfq);
      setQuotations(q.data.quotations || []);
    } catch { toast.error('Failed to load RFQ'); navigate('/rfqs'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleSend = async () => {
    try { await api.patch(`/rfqs/${id}/send`); toast.success('RFQ sent to vendors!'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
  };

  const handleClose = async () => {
    if (!window.confirm('Close this RFQ?')) return;
    try { await api.patch(`/rfqs/${id}/close`); toast.success('RFQ closed'); load(); }
    catch { toast.error('Failed to close RFQ'); }
  };

  if (loading) return <Loader />;
  if (!rfq) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>
            <Link to="/rfqs" style={{ color:'var(--primary)' }}>RFQs</Link> / {rfq.rfqNumber}
          </div>
          <div className="page-title">{rfq.title}</div>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <Badge status={rfq.status} /><Badge status={rfq.priority} /><Badge status={rfq.approvalStatus !== 'none' ? rfq.approvalStatus : null} text={rfq.approvalStatus !== 'none' ? `Approval: ${rfq.approvalStatus}` : null} />
          </div>
        </div>
        <div className="page-actions">
          {rfq.status === 'draft' && ['admin','procurement_officer'].includes(user?.role) && (
            <>
              <Link to={`/rfqs/${id}/edit`} className="btn btn-secondary" style={{ display:'flex', gap:6, alignItems:'center' }}><Edit size={16} /> Edit</Link>
              <button className="btn btn-primary" onClick={handleSend} style={{ display:'flex', gap:6, alignItems:'center' }}><Send size={16} /> Send to Vendors</button>
            </>
          )}
          {rfq.status === 'sent' && (
            <>
              {['admin','procurement_officer','manager'].includes(user?.role) && <Link to={`/rfqs/${id}/compare`} className="btn btn-primary" style={{ display:'flex', gap:6, alignItems:'center' }}><BarChart3 size={16} /> Compare Quotations</Link>}
              {['admin','procurement_officer'].includes(user?.role) && <button className="btn btn-ghost" onClick={handleClose}>Close RFQ</button>}
            </>
          )}
          {user?.role === 'vendor' && rfq.status === 'sent' && (
            <Link to={`/quotations/submit/${id}`} className="btn btn-primary" style={{ display:'flex', gap:6, alignItems:'center' }}><FileText size={16} /> Submit Quotation</Link>
          )}
        </div>
      </div>

      <div className="grid-2 mb-16" style={{ gridTemplateColumns:'2fr 1fr' }}>
        <div className="detail-section">
          <div className="detail-section-title">RFQ Information</div>
          <div className="detail-row"><span className="detail-label">RFQ Number</span><span className="detail-value" style={{ fontFamily:'monospace', fontWeight:700 }}>{rfq.rfqNumber}</span></div>
          <div className="detail-row"><span className="detail-label">Title</span><span className="detail-value">{rfq.title}</span></div>
          <div className="detail-row"><span className="detail-label">Deadline</span><span className="detail-value">{new Date(rfq.deadline).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</span></div>
          <div className="detail-row"><span className="detail-label">Priority</span><span className="detail-value"><Badge status={rfq.priority} /></span></div>
          <div className="detail-row"><span className="detail-label">Created By</span><span className="detail-value">{rfq.createdBy?.name}</span></div>
          <div className="detail-row"><span className="detail-label">Created On</span><span className="detail-value">{new Date(rfq.createdAt).toLocaleDateString('en-IN')}</span></div>
          {rfq.sentAt && <div className="detail-row"><span className="detail-label">Sent On</span><span className="detail-value">{new Date(rfq.sentAt).toLocaleDateString('en-IN')}</span></div>}
          {rfq.description && <div style={{ marginTop:12 }}><div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:4 }}>Description</div><div style={{ fontSize:13.5 }}>{rfq.description}</div></div>}
        </div>
        <div className="detail-section">
          <div className="detail-section-title">Assigned Vendors ({rfq.vendors?.length || 0})</div>
          {rfq.vendors?.length === 0 ? <div style={{ color:'var(--text-muted)', fontSize:13 }}>No vendors assigned yet</div> :
            rfq.vendors?.map(v => (
              <div key={v._id} style={{ padding:'10px 0', borderBottom:'1px solid var(--border-light)' }}>
                <div style={{ fontWeight:600, fontSize:13.5 }}>{v.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{v.email}</div>
                <div style={{ fontSize:11, background:'var(--primary-100)', color:'var(--primary)', padding:'2px 8px', borderRadius:20, display:'inline-block', marginTop:4, fontWeight:600 }}>{v.category}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="detail-section mb-16">
        <div className="detail-section-title">Items / Products ({rfq.items?.length})</div>
        <table><thead><tr><th>#</th><th>Item Name</th><th>Description</th><th>Quantity</th><th>Unit</th><th>Est. Price</th></tr></thead>
        <tbody>
          {rfq.items?.map((item, i) => (
            <tr key={i}>
              <td>{i+1}</td>
              <td style={{ fontWeight:600 }}>{item.name}</td>
              <td style={{ color:'var(--text-secondary)' }}>{item.description || '—'}</td>
              <td>{item.quantity}</td>
              <td>{item.unit}</td>
              <td>{item.estimatedUnitPrice > 0 ? `₹${item.estimatedUnitPrice.toLocaleString('en-IN')}` : '—'}</td>
            </tr>
          ))}
        </tbody></table>
      </div>

      {quotations.length > 0 && (
        <div className="detail-section">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div className="detail-section-title" style={{ marginBottom:0 }}>Quotations Received ({quotations.length})</div>
            {rfq.status === 'sent' && ['admin','procurement_officer','manager'].includes(user?.role) && (
              <Link to={`/rfqs/${id}/compare`} className="btn btn-primary btn-sm" style={{ display:'flex', gap:6, alignItems:'center' }}><BarChart3 size={16} /> Compare All</Link>
            )}
          </div>
          <table><thead><tr><th>Vendor</th><th>Total Amount</th><th>Delivery</th><th>Status</th><th>Submitted</th></tr></thead>
          <tbody>
            {quotations.map(q => (
              <tr key={q._id}>
                <td style={{ fontWeight:600 }}>{q.vendorId?.name}</td>
                <td style={{ fontWeight:700, color:'var(--primary)' }}>₹{q.totalAmount.toLocaleString('en-IN')}</td>
                <td>{q.deliveryTimeline} days</td>
                <td><Badge status={q.status} /></td>
                <td>{new Date(q.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  );
};

export default RFQDetail;
