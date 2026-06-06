import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Settings, Receipt, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PODetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [po, setPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [invoiceForm, setInvoiceForm] = useState({ dueDate:'', paymentTerms:'Net 30', notes:'', buyerDetails:{ name:'VendorBridge Corp', address:'', gstNumber:'', email:'', phone:'' } });
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    try { const res = await api.get(`/purchase-orders/${id}`); setPO(res.data.purchaseOrder); }
    catch { toast.error('PO not found'); navigate('/purchase-orders'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusUpdate = async () => {
    try { await api.patch(`/purchase-orders/${id}/status`, { status: newStatus }); toast.success('Status updated'); setStatusModal(false); load(); }
    catch { toast.error('Failed to update status'); }
  };

  const handleGenerateInvoice = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/invoices', { poId: id, ...invoiceForm });
      toast.success('Invoice generated!');
      setInvoiceModal(false);
      navigate(`/invoices/${res.data.invoice._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate invoice'); }
    setGenerating(false);
  };

  if (loading) return <Loader />;
  if (!po) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>
            <Link to="/purchase-orders" style={{ color:'var(--primary)' }}>Purchase Orders</Link> / {po.poNumber}
          </div>
          <div className="page-title">{po.poNumber}</div>
          <div style={{ marginTop:8 }}><Badge status={po.status} /></div>
        </div>
        <div className="page-actions">
          {['admin','procurement_officer'].includes(user?.role) && po.status !== 'cancelled' && (
            <button className="btn btn-ghost" onClick={() => { setNewStatus(po.status); setStatusModal(true); }} style={{ display:'flex', gap:6, alignItems:'center' }}><Settings size={16} /> Update Status</button>
          )}
          {['admin','procurement_officer'].includes(user?.role) && po.status !== 'cancelled' && !po.invoiceGenerated && (
            <button className="btn btn-primary" onClick={() => setInvoiceModal(true)} style={{ display:'flex', gap:6, alignItems:'center' }}><Receipt size={16} /> Generate Invoice</button>
          )}
          {po.invoiceGenerated && <Link to="/invoices" className="btn btn-secondary" style={{ display:'flex', gap:6, alignItems:'center' }}>View Invoice <ArrowRight size={16} /></Link>}
        </div>
      </div>

      <div className="grid-2 mb-16" style={{ gridTemplateColumns:'1fr 1fr' }}>
        <div className="detail-section">
          <div className="detail-section-title">PO Information</div>
          <div className="detail-row"><span className="detail-label">PO Number</span><span className="detail-value" style={{ fontFamily:'monospace', fontWeight:700 }}>{po.poNumber}</span></div>
          <div className="detail-row"><span className="detail-label">RFQ Reference</span><span className="detail-value">{po.rfqId?.rfqNumber || '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Created By</span><span className="detail-value">{po.createdBy?.name}</span></div>
          <div className="detail-row"><span className="detail-label">Created On</span><span className="detail-value">{new Date(po.createdAt).toLocaleDateString('en-IN')}</span></div>
          <div className="detail-row"><span className="detail-label">Confirmed On</span><span className="detail-value">{po.confirmedAt ? new Date(po.confirmedAt).toLocaleDateString('en-IN') : '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Delivery Date</span><span className="detail-value">{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('en-IN') : '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Payment Terms</span><span className="detail-value">{po.paymentTerms}</span></div>
          <div className="detail-row"><span className="detail-label">Invoice</span><span className="detail-value">{po.invoiceGenerated ? <Badge status="confirmed" text="Generated" /> : <Badge status="draft" text="Not Generated" />}</span></div>
        </div>
        <div className="detail-section">
          <div className="detail-section-title">Vendor Details</div>
          <div className="detail-row"><span className="detail-label">Vendor Name</span><span className="detail-value" style={{ fontWeight:700 }}>{po.vendorId?.name}</span></div>
          <div className="detail-row"><span className="detail-label">Category</span><span className="detail-value">{po.vendorId?.category}</span></div>
          <div className="detail-row"><span className="detail-label">Contact</span><span className="detail-value">{po.vendorId?.contactPerson}</span></div>
          <div className="detail-row"><span className="detail-label">Email</span><span className="detail-value">{po.vendorId?.email}</span></div>
          <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{po.vendorId?.phone}</span></div>
          {po.vendorId?.gstNumber && <div className="detail-row"><span className="detail-label">GST Number</span><span className="detail-value" style={{ fontFamily:'monospace' }}>{po.vendorId?.gstNumber}</span></div>}
        </div>
      </div>

      <div className="detail-section mb-16">
        <div className="detail-section-title">Items & Pricing</div>
        <table>
          <thead><tr><th>#</th><th>Item</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr></thead>
          <tbody>
            {po.items?.map((item, i) => (
              <tr key={i}>
                <td>{i+1}</td>
                <td style={{ fontWeight:600 }}>{item.name}</td>
                <td>{item.quantity}</td>
                <td>₹{(item.unitPrice||0).toLocaleString('en-IN')}</td>
                <td style={{ fontWeight:600 }}>₹{(item.total||0).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
          <div style={{ width:280 }}>
            <div className="invoice-total-row"><span>Subtotal</span><span>₹{(po.subTotal||0).toLocaleString('en-IN')}</span></div>
            <div className="invoice-total-row"><span>GST ({po.taxRate}%)</span><span>₹{(po.taxAmount||0).toLocaleString('en-IN')}</span></div>
            <div className="invoice-grand-total"><span>Grand Total</span><span>₹{(po.grandTotal||0).toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Update PO Status" size="sm"
        footer={<><button className="btn btn-ghost" onClick={() => setStatusModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleStatusUpdate}>Update</button></>}>
        <div className="form-group">
          <label className="form-label">New Status</label>
          <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            <option value="confirmed">Confirmed</option>
            <option value="partially_delivered">Partially Delivered</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal isOpen={invoiceModal} onClose={() => setInvoiceModal(false)} title={<div style={{ display:'flex', gap:8, alignItems:'center' }}><Receipt size={20} /> Generate Invoice</div>} size="md"
        footer={<><button className="btn btn-ghost" onClick={() => setInvoiceModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleGenerateInvoice} disabled={generating}>{generating ? 'Generating...' : 'Generate Invoice'}</button></>}>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-control" type="date" value={invoiceForm.dueDate} onChange={e => setInvoiceForm(f => ({...f, dueDate: e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Terms</label>
            <select className="form-control" value={invoiceForm.paymentTerms} onChange={e => setInvoiceForm(f => ({...f, paymentTerms: e.target.value}))}>
              <option>Net 30</option><option>Net 60</option><option>Net 90</option><option>Immediate</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Buyer Company Name</label>
          <input className="form-control" value={invoiceForm.buyerDetails.name} onChange={e => setInvoiceForm(f => ({...f, buyerDetails:{...f.buyerDetails,name:e.target.value}}))} />
        </div>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Buyer GST Number</label>
            <input className="form-control" value={invoiceForm.buyerDetails.gstNumber} onChange={e => setInvoiceForm(f => ({...f, buyerDetails:{...f.buyerDetails,gstNumber:e.target.value}}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Buyer Email</label>
            <input className="form-control" type="email" value={invoiceForm.buyerDetails.email} onChange={e => setInvoiceForm(f => ({...f, buyerDetails:{...f.buyerDetails,email:e.target.value}}))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" rows="2" value={invoiceForm.notes} onChange={e => setInvoiceForm(f => ({...f, notes: e.target.value}))} />
        </div>
        <div className="alert alert-info">Invoice will be generated for <strong>₹{(po.grandTotal||0).toLocaleString('en-IN')}</strong> (including {po.taxRate}% GST)</div>
      </Modal>
    </div>
  );
};

export default PODetail;
