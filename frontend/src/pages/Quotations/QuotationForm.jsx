import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QuotationForm = () => {
  const { rfqId, id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && !rfqId;
  const [rfq, setRFQ] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    items: [], deliveryTimeline: 14, notes: '', termsConditions: '', validUntil: ''
  });

  useEffect(() => {
    if (rfqId) {
      api.get(`/rfqs/${rfqId}`).then(r => {
        const rfqData = r.data.rfq;
        setRFQ(rfqData);
        setForm(f => ({ ...f, items: rfqData.items.map(i => ({ name: i.name, quantity: i.quantity, unitPrice: 0, total: 0 })) }));
      }).catch(() => { toast.error('RFQ not found'); navigate('/rfqs'); });
    }
    if (isEdit) {
      api.get(`/quotations/${id}`).then(r => {
        const q = r.data.quotation;
        setRFQ(q.rfqId);
        setForm({ items: q.items.map(i => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })), deliveryTimeline: q.deliveryTimeline, notes: q.notes || '', termsConditions: q.termsConditions || '', validUntil: q.validUntil?.slice(0,10) || '' });
      }).catch(() => navigate('/quotations'));
    }
  }, [rfqId, id]);

  const setItem = (i,k,v) => {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [k]: +v, total: k === 'unitPrice' ? items[i].quantity * +v : +v * items[i].unitPrice };
      return { ...f, items };
    });
  };

  const totalAmount = form.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.items.every(i => i.unitPrice > 0)) { toast.error('Enter unit price for all items'); return; }
    setSaving(true);
    try {
      const payload = { ...form, rfqId: rfqId || rfq?._id, totalAmount };
      if (isEdit) { await api.put(`/quotations/${id}`, payload); toast.success('Quotation updated'); }
      else { await api.post('/quotations', payload); toast.success('Quotation submitted successfully!'); }
      navigate('/quotations');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth:800, margin:'0 auto' }}>
      <div className="page-header">
        <div>
          <div className="page-title">{isEdit ? 'Edit Quotation' : 'Submit Quotation'}</div>
          {rfq && <div className="page-subtitle">For: {rfq.rfqNumber} — {rfq.title}</div>}
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/quotations')}>← Back</button>
      </div>

      {rfq && (
        <div className="card mb-16" style={{ background:'var(--primary-100)', border:'1px solid var(--primary-border)' }}>
          <div style={{ fontWeight:700, color:'var(--primary)', marginBottom:8 }}>RFQ Details</div>
          <div className="form-row cols-2">
            <div><span style={{ color:'var(--text-secondary)', fontSize:12 }}>Deadline: </span><strong>{new Date(rfq.deadline).toLocaleDateString('en-IN')}</strong></div>
            <div><span style={{ color:'var(--text-secondary)', fontSize:12 }}>Items: </span><strong>{rfq.items?.length || form.items.length}</strong></div>
          </div>
          {rfq.description && <div style={{ marginTop:8, fontSize:13, color:'var(--text-secondary)' }}>{rfq.description}</div>}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card mb-16">
          <div className="form-section-title">Pricing Details</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:'var(--bg-page)' }}>
                {['Item','Quantity','Unit Price (₹)','Total (₹)'].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:12, fontWeight:700, color:'var(--text-secondary)', borderBottom:'1px solid var(--border)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {form.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--border-light)' }}>
                    <td style={{ padding:'10px 12px', fontWeight:600 }}>{item.name}</td>
                    <td style={{ padding:'10px 12px' }}>{item.quantity}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <input className="form-control" type="number" min="0.01" step="0.01" value={item.unitPrice || ''} onChange={e => setItem(i,'unitPrice',e.target.value)} placeholder="0.00" required style={{ maxWidth:140 }} />
                    </td>
                    <td style={{ padding:'10px 12px', fontWeight:700, color:'var(--primary)' }}>
                      ₹{(item.quantity * (item.unitPrice||0)).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background:'var(--primary-bg)' }}>
                  <td colSpan="3" style={{ padding:'12px', textAlign:'right', fontWeight:700, fontSize:15 }}>Total Amount:</td>
                  <td style={{ padding:'12px', fontWeight:800, fontSize:18, color:'var(--primary)' }}>₹{totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="card mb-16">
          <div className="form-section-title">Delivery & Terms</div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Delivery Timeline (days) <span className="req">*</span></label>
              <input className="form-control" type="number" min="1" value={form.deliveryTimeline} onChange={e => setForm(f => ({...f, deliveryTimeline: +e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Quotation Valid Until</label>
              <input className="form-control" type="date" value={form.validUntil} onChange={e => setForm(f => ({...f, validUntil: e.target.value}))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Terms & Conditions</label>
            <textarea className="form-control" rows="3" value={form.termsConditions} onChange={e => setForm(f => ({...f, termsConditions: e.target.value}))} placeholder="Payment terms, warranty, etc..." />
          </div>
          <div className="form-group">
            <label className="form-label">Additional Notes</label>
            <textarea className="form-control" rows="2" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Any additional information..." />
          </div>
        </div>

        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/quotations')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? 'Submitting...' : isEdit ? 'Update Quotation' : 'Submit Quotation'}</button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;
