import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, PackageOpen, Trophy, Zap, Hourglass } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const QuotationComparison = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRFQ] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectModal, setSelectModal] = useState(null);
  const [approvalModal, setApprovalModal] = useState(null);
  const [approvalForm, setApprovalForm] = useState({ priority:'medium', dueDate:'' });
  
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

  const load = async () => {
    try {
      const [r, q] = await Promise.all([api.get(`/rfqs/${id}`), api.get(`/rfqs/${id}/quotations`)]);
      setRFQ(r.data.rfq);
      setQuotations(q.data.quotations || []);
    } catch { toast.error('Failed to load'); navigate('/rfqs'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const lowestPrice = Math.min(...quotations.map(q => q.totalAmount));
  const fastestDelivery = Math.min(...quotations.map(q => q.deliveryTimeline));

  const handleSelect = async (quotation) => {
    try {
      await api.patch(`/quotations/${quotation._id}/accept`);
      toast.success('Quotation selected for review');
      setSelectModal(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRequestApproval = async () => {
    if (!rfq?.selectedQuotationId) { toast.error('Select a quotation first'); return; }
    const selected = quotations.find(q => q._id === rfq.selectedQuotationId?._id || q._id === rfq.selectedQuotationId);
    if (!selected) { toast.error('Selected quotation not found'); return; }
    try {
      await api.post('/approvals', { rfqId: id, quotationId: selected._id, vendorId: selected.vendorId._id, title: `Approval for RFQ: ${rfq.title}`, amount: selected.totalAmount, priority: approvalForm.priority, dueDate: approvalForm.dueDate });
      toast.success('Approval request submitted!');
      setApprovalModal(false);
      navigate('/approvals');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleGeneratePO = async () => {
    const acceptedQuotation = quotations.find(q => q.status === 'accepted' || q._id === rfq.selectedQuotationId?._id || q._id === rfq.selectedQuotationId);
    if (!acceptedQuotation) {
      toast.error('No accepted quotation found to generate PO.');
      return;
    }
    setPoGenerating(true);
    try {
      const payload = {
        quotationId: acceptedQuotation._id,
        rfqId: id,
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

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>
            <Link to="/rfqs" style={{ color:'var(--primary)' }}>RFQs</Link> / <Link to={`/rfqs/${id}`} style={{ color:'var(--primary)' }}>{rfq?.rfqNumber}</Link> / Compare
          </div>
          <div className="page-title">Quotation Comparison</div>
          <div className="page-subtitle">{rfq?.title} — {quotations.length} quotation(s) received</div>
        </div>
        <div className="page-actions">
          {rfq?.approvalStatus !== 'pending' && rfq?.approvalStatus !== 'approved' && quotations.some(q => q.status === 'under_review') && (
            <button className="btn btn-primary" onClick={() => setApprovalModal(true)} style={{ display:'flex', gap:6, alignItems:'center' }}><CheckCircle size={16} /> Request Approval</button>
          )}
          {rfq?.approvalStatus === 'pending' && <span className="badge badge-warning" style={{ fontSize:13, display:'inline-flex', gap:6, alignItems:'center' }}><Hourglass size={14} /> Approval Pending</span>}
          {rfq?.approvalStatus === 'approved' && rfq?.status !== 'closed' && (
            <button className="btn btn-success" onClick={() => setPOModal(true)} style={{ display:'flex', gap:6, alignItems:'center' }}>
              <CheckCircle size={16} /> Generate PO
            </button>
          )}
          {rfq?.approvalStatus === 'approved' && rfq?.status === 'closed' && (
            <span className="badge badge-success" style={{ fontSize:13 }}>PO Generated (Closed)</span>
          )}
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ color:'var(--primary)' }}><PackageOpen size={48} /></div>
          <div style={{ fontSize:18, fontWeight:700, marginTop:16 }}>No quotations received yet</div>
          <div style={{ color:'var(--text-secondary)', marginTop:8 }}>Vendors haven't submitted quotations for this RFQ</div>
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${quotations.length}, 1fr)`, gap:16, marginBottom:24 }}>
            {quotations.map(q => {
              const isLowest = q.totalAmount === lowestPrice;
              const isFastest = q.deliveryTimeline === fastestDelivery;
              const isSelected = rfq?.selectedQuotationId?._id === q._id || rfq?.selectedQuotationId === q._id;
              return (
                <div key={q._id} className={`comparison-card ${isLowest ? 'lowest' : ''}`}>
                  <div className="comparison-card-header">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15 }}>{q.vendorId?.name}</div>
                        <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{q.vendorId?.category}</div>
                        <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                          {isLowest && <span className="badge badge-success" style={{ fontSize:11, display:'inline-flex', gap:4, alignItems:'center' }}><Trophy size={12} /> Lowest Price</span>}
                          {isFastest && <span className="badge badge-info" style={{ fontSize:11, display:'inline-flex', gap:4, alignItems:'center' }}><Zap size={12} /> Fastest Delivery</span>}
                          {isSelected && <span className="badge badge-primary" style={{ fontSize:11 }}>✓ Selected</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:4, flexDirection:'column', alignItems:'flex-end' }}>
                        {'★'.repeat(Math.round(q.vendorId?.rating||0))}
                        <Badge status={q.status} />
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:'16px' }}>
                    <div className={`comparison-amount ${isLowest ? 'lowest' : ''}`}>₹{q.totalAmount.toLocaleString('en-IN')}</div>
                    <div className="comparison-detail"><span style={{ color:'var(--text-secondary)' }}>Delivery</span><span style={{ fontWeight:600 }}>{q.deliveryTimeline} days</span></div>
                    {q.items.map((item, i) => (
                      <div key={i} className="comparison-detail">
                        <span style={{ color:'var(--text-secondary)', fontSize:12 }}>{item.name}</span>
                        <span style={{ fontWeight:600, fontSize:12 }}>₹{(item.unitPrice||0).toLocaleString('en-IN')}/u</span>
                      </div>
                    ))}
                    {q.notes && <div style={{ marginTop:10, fontSize:12, color:'var(--text-secondary)', background:'var(--bg-page)', padding:'8px 10px', borderRadius:'var(--radius)' }}>{q.notes}</div>}
                    {q.validUntil && <div style={{ marginTop:8, fontSize:12, color:'var(--text-muted)' }}>Valid until: {new Date(q.validUntil).toLocaleDateString('en-IN')}</div>}
                  </div>
                  <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
                    {q.status === 'submitted' && (
                      <button className="btn btn-primary btn-sm" style={{ flex:1 }} onClick={() => setSelectModal(q)}>Select</button>
                    )}
                    {q.status === 'under_review' && <span style={{ fontSize:12, color:'var(--primary)', fontWeight:600 }}>✓ Under Review</span>}
                    {q.status === 'accepted' && <span style={{ fontSize:12, color:'var(--success)', fontWeight:600 }}>✓ Accepted</span>}
                    {q.status !== 'rejected' && <button className="btn btn-ghost btn-sm" onClick={async () => { try { await api.patch(`/quotations/${q._id}/reject`, { reason:'Not selected' }); toast.success('Quotation rejected'); load(); } catch { toast.error('Failed'); } }}>Reject</button>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Items Comparison Table */}
          <div className="card">
            <div className="card-title">Side-by-Side Price Comparison</div>
            <div style={{ overflowX:'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    {quotations.map(q => <th key={q._id} style={{ color:q.totalAmount===lowestPrice?'var(--success)':'inherit' }}>{q.vendorId?.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rfq?.items?.map((item, i) => {
                    const prices = quotations.map(q => q.items[i]?.unitPrice || 0);
                    const minPrice = Math.min(...prices.filter(p => p > 0));
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight:600 }}>{item.name} <span style={{ color:'var(--text-muted)', fontWeight:400 }}>({item.quantity} {item.unit})</span></td>
                        {quotations.map(q => {
                          const price = q.items[i]?.unitPrice || 0;
                          return <td key={q._id} style={{ fontWeight:price===minPrice&&price>0?700:400, color:price===minPrice&&price>0?'var(--success)':'inherit' }}>
                            {price > 0 ? `₹${price.toLocaleString('en-IN')}` : '—'}
                          </td>;
                        })}
                      </tr>
                    );
                  })}
                  <tr style={{ background:'var(--primary-100)', fontWeight:700 }}>
                    <td>TOTAL</td>
                    {quotations.map(q => <td key={q._id} style={{ color:q.totalAmount===lowestPrice?'var(--success)':'var(--primary)', fontSize:15, fontWeight:800 }}>₹{q.totalAmount.toLocaleString('en-IN')}</td>)}
                  </tr>
                  <tr>
                    <td style={{ color:'var(--text-secondary)' }}>Delivery</td>
                    {quotations.map(q => <td key={q._id} style={{ fontWeight:q.deliveryTimeline===fastestDelivery?700:400, color:q.deliveryTimeline===fastestDelivery?'var(--info)':'inherit' }}>{q.deliveryTimeline} days</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Select Confirm */}
      <Modal isOpen={!!selectModal} onClose={() => setSelectModal(null)} title="Select Quotation" size="sm"
        footer={<><button className="btn btn-ghost" onClick={() => setSelectModal(null)}>Cancel</button><button className="btn btn-primary" onClick={() => handleSelect(selectModal)}>Confirm Selection</button></>}>
        <p>Select quotation from <strong>{selectModal?.vendorId?.name}</strong> for <strong>₹{selectModal?.totalAmount?.toLocaleString('en-IN')}</strong>?</p>
        <p style={{ marginTop:8, fontSize:13, color:'var(--text-secondary)' }}>This will mark the quotation for review and you can then request approval.</p>
      </Modal>

      {/* Approval Request */}
      <Modal isOpen={approvalModal} onClose={() => setApprovalModal(false)} title="Request Approval" size="md"
        footer={<><button className="btn btn-ghost" onClick={() => setApprovalModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleRequestApproval}>Submit for Approval</button></>}>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="form-control" value={approvalForm.priority} onChange={e => setApprovalForm(f => ({...f, priority: e.target.value}))}>
            <option value="low">Low</option><option value="medium">Medium</option>
            <option value="high">High</option><option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input className="form-control" type="date" value={approvalForm.dueDate} onChange={e => setApprovalForm(f => ({...f, dueDate: e.target.value}))} />
        </div>
        <div className="alert alert-info">The selected quotation will be sent to managers for approval.</div>
      </Modal>

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
      </Modal>
    </div>
  );
};

export default QuotationComparison;
