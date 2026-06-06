import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';

const POList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [poModal, setPOModal] = useState(false);
  const [poForm, setPOForm] = useState({
    deliveryDate: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    paymentTerms: 'Net 30',
    taxRate: 18,
    notes: '',
    terms: ''
  });
  const [poGenerating, setPoGenerating] = useState(false);

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

  const fetchPendingApprovals = async () => {
    try {
      const res = await api.get('/approvals?pendingPO=true');
      setPendingApprovals(res.data.approvals || []);
    } catch (err) {
      console.error('Failed to fetch pending approvals', err);
    }
  };

  useEffect(() => {
    fetch();
    if (user?.role === 'procurement_officer') {
      fetchPendingApprovals();
    }
  }, [page, status, search, user]);

  const handleGeneratePO = async () => {
    if (!selectedApproval) return;
    setPoGenerating(true);
    try {
      const payload = {
        quotationId: selectedApproval.quotationId?._id || selectedApproval.quotationId,
        rfqId: selectedApproval.rfqId?._id || selectedApproval.rfqId,
        deliveryDate: poForm.deliveryDate || undefined,
        deliveryAddress: {
          street: poForm.street,
          city: poForm.city,
          state: poForm.state,
          pincode: poForm.pincode,
          country: 'India'
        },
        paymentTerms: poForm.paymentTerms,
        taxRate: poForm.taxRate,
        notes: poForm.notes,
        terms: poForm.terms
      };
      const res = await api.post('/purchase-orders', payload);
      toast.success('Purchase Order generated successfully!');
      setPOModal(false);
      fetch();
      fetchPendingApprovals();
      navigate(`/purchase-orders/${res.data.purchaseOrder._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate PO');
    } finally {
      setPoGenerating(false);
    }
  };

  const subTotal = selectedApproval?.quotationId?.totalAmount || selectedApproval?.amount || 0;
  const taxRate = poForm.taxRate || 0;
  const taxAmount = (subTotal * taxRate) / 100;
  const grandTotal = subTotal + taxAmount;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Purchase Orders</div>
          <div className="page-subtitle">Manage all purchase orders</div>
        </div>
      </div>

      {user?.role === 'procurement_officer' && pendingApprovals.length > 0 && (
        <div className="card mb-16" style={{ borderLeft: '4px solid var(--success)', background: 'var(--primary-100)' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={18} className="text-success" />
            Approved Quotations Awaiting Purchase Order
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginTop: 12 }}>
            {pendingApprovals.map(app => (
              <div key={app._id} className="card" style={{ padding: 16, background: '#fff', border: '1px solid var(--primary-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>{app.rfqId?.rfqNumber || '—'}</span>
                    <h4 style={{ margin: '4px 0', fontSize: 14, fontWeight: 600 }}>{app.title}</h4>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      Vendor: <strong>{app.vendorId?.name}</strong>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      Amount: <strong>₹{(app.amount || 0).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                  <button className="btn btn-success btn-sm" onClick={() => {
                    setSelectedApproval(app);
                    setPOForm({
                      deliveryDate: '',
                      street: '',
                      city: '',
                      state: '',
                      pincode: '',
                      paymentTerms: 'Net 30',
                      taxRate: 18,
                      notes: '',
                      terms: ''
                    });
                    setPOModal(true);
                  }}>
                    Generate PO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

      {/* Generate PO Modal */}
      <Modal isOpen={poModal} onClose={() => setPOModal(false)} title="Generate Purchase Order" size="md"
        footer={<><button className="btn btn-ghost" onClick={() => setPOModal(false)}>Cancel</button><button className="btn btn-success" onClick={handleGeneratePO} disabled={poGenerating}>{poGenerating ? 'Generating...' : 'Confirm & Generate PO'}</button></>}>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Delivery Date</label>
            <input className="form-control" type="date" value={poForm.deliveryDate} onChange={e => setPOForm(f => ({...f, deliveryDate: e.target.value}))} min={new Date().toISOString().slice(0,10)} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Terms</label>
            <select className="form-control" value={poForm.paymentTerms} onChange={e => setPOForm(f => ({...f, paymentTerms: e.target.value}))}>
              <option value="Net 30">Net 30</option>
              <option value="Net 60">Net 60</option>
              <option value="Net 90">Net 90</option>
              <option value="Immediate">Immediate</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Tax Rate (GST %)</label>
          <input className="form-control" type="number" min="0" max="100" value={poForm.taxRate} onChange={e => setPOForm(f => ({...f, taxRate: +e.target.value}))} />
        </div>
        <div className="form-section-title" style={{ marginTop:16, marginBottom:8 }}>Delivery Address</div>
        <div className="form-group">
          <label className="form-label">Street Address</label>
          <input className="form-control" value={poForm.street} onChange={e => setPOForm(f => ({...f, street: e.target.value}))} placeholder="123 Business Rd" />
        </div>
        <div className="form-row cols-3">
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-control" value={poForm.city} onChange={e => setPOForm(f => ({...f, city: e.target.value}))} placeholder="Mumbai" />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-control" value={poForm.state} onChange={e => setPOForm(f => ({...f, state: e.target.value}))} placeholder="Maharashtra" />
          </div>
          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input className="form-control" value={poForm.pincode} onChange={e => setPOForm(f => ({...f, pincode: e.target.value}))} placeholder="400001" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Terms & Conditions</label>
          <textarea className="form-control" rows="2" value={poForm.terms} onChange={e => setPOForm(f => ({...f, terms: e.target.value}))} placeholder="Delivery conditions, penalty terms, etc..." />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" rows="2" value={poForm.notes} onChange={e => setPOForm(f => ({...f, notes: e.target.value}))} placeholder="Additional notes..." />
        </div>
        <div className="alert alert-info" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <strong>₹{subTotal.toLocaleString('en-IN')}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>GST ({taxRate}%):</span>
            <strong>₹{taxAmount.toLocaleString('en-IN')}</strong>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--primary-border)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
            <span>Grand Total:</span>
            <strong>₹{grandTotal.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </Modal>
    </div>
    </div>
  );
};

export default POList;
