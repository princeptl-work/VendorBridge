import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Edit, Search } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const QuotationList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
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

  const handleGeneratePO = async () => {
    if (!selectedQuotation || !selectedRFQ) return;
    setPoGenerating(true);
    try {
      const payload = {
        quotationId: selectedQuotation._id,
        rfqId: selectedRFQ._id,
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
      navigate(`/purchase-orders/${res.data.purchaseOrder._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate PO');
    } finally {
      setPoGenerating(false);
    }
  };

  const subTotal = selectedQuotation ? selectedQuotation.totalAmount : 0;
  const taxRate = poForm.taxRate || 0;
  const taxAmount = (subTotal * taxRate) / 100;
  const grandTotal = subTotal + taxAmount;

  const grouped = quotations.reduce((acc, q) => {
    const rfqKey = q.rfqId?._id || 'unassigned';
    if (!acc[rfqKey]) {
      acc[rfqKey] = {
        rfq: q.rfqId || { rfqNumber: 'Unassigned', title: 'General Quotations' },
        items: []
      };
    }
    acc[rfqKey].items.push(q);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quotations</div>
          <div className="page-subtitle">View and manage vendor quotations</div>
        </div>
      </div>

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? <Loader /> : quotations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ color: 'var(--primary)' }}><FileText size={48} /></div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 16 }}>No quotations found</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: 8 }}>You haven't submitted or received any quotations yet.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.values(grouped).map(({ rfq, items }) => (
            <div key={rfq._id || 'unassigned'} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ background: 'var(--bg-light)', padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>{rfq.rfqNumber}</span>
                  <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>|</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{rfq.title}</span>
                </div>
                {['admin', 'procurement_officer', 'manager'].includes(user?.role) && rfq._id && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {user?.role === 'procurement_officer' && rfq.approvalStatus === 'approved' && rfq.status !== 'closed' && (
                      <button className="btn btn-success btn-sm" onClick={() => {
                        const accepted = items.find(q => q.status === 'accepted' || q._id === rfq.selectedQuotationId || q._id === rfq.selectedQuotationId?._id);
                        if (accepted) {
                          setSelectedRFQ(rfq);
                          setSelectedQuotation(accepted);
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
                        } else {
                          toast.error('No accepted quotation found for this RFQ.');
                        }
                      }}>Generate PO</button>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/rfqs/${rfq._id}/compare`)}>Compare Quotations</button>
                  </div>
                )}
              </div>
              <div style={{ padding: '0 20px 10px' }}>
                <table className="table" style={{ margin: 0, width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Total Amount</th>
                      <th>Delivery</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      {user?.role === 'vendor' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(q => (
                      <tr key={q._id}>
                        <td style={{ fontWeight: 600 }}>{q.vendorId?.name || '—'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{q.totalAmount.toLocaleString('en-IN')}</td>
                        <td>{q.deliveryTimeline} days</td>
                        <td><Badge status={q.status} /></td>
                        <td>{new Date(q.createdAt).toLocaleDateString('en-IN')}</td>
                        {user?.role === 'vendor' && (
                          <td>
                            {q.status === 'submitted' && (
                              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/quotations/${q._id}/edit`)} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Edit size={16} /> Edit</button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="table-pagination" style={{ marginTop: 24 }}>
          <span>Showing {quotations.length} of {pagination.total}</span>
          <div className="pagination-btns">
            <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button className="pg-btn" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
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
  );
};

export default QuotationList;
