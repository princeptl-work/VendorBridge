import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Search } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';

const InvoiceList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const [pendingPOs, setPendingPOs] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    dueDate: '',
    paymentTerms: 'Net 30',
    notes: '',
    buyerDetails: { name: 'VendorBridge Corp', address: '', gstNumber: '', email: '', phone: '' }
  });
  const [generating, setGenerating] = useState(false);

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

  const fetchPendingPOs = async () => {
    try {
      const res = await api.get('/purchase-orders?pendingInvoice=true');
      setPendingPOs(res.data.purchaseOrders || []);
    } catch (err) {
      console.error('Failed to fetch pending POs', err);
    }
  };

  useEffect(() => {
    fetch();
    if (user?.role === 'procurement_officer') {
      fetchPendingPOs();
    }
  }, [page, status, search, user]);

  const handleGenerateInvoice = async () => {
    if (!selectedPO) return;
    setGenerating(true);
    try {
      const res = await api.post('/invoices', { poId: selectedPO._id, ...invoiceForm });
      toast.success('Invoice generated!');
      setInvoiceModal(false);
      fetch();
      fetchPendingPOs();
      navigate(`/invoices/${res.data.invoice._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Invoices</div>
          <div className="page-subtitle">View and manage all invoices</div>
        </div>
      </div>

      {user?.role === 'procurement_officer' && pendingPOs.length > 0 && (
        <div className="card mb-16" style={{ borderLeft: '4px solid var(--primary)', background: 'var(--primary-100)' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={18} className="text-primary" />
            Purchase Orders Awaiting Invoice
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginTop: 12 }}>
            {pendingPOs.map(po => (
              <div key={po._id} className="card" style={{ padding: 16, background: '#fff', border: '1px solid var(--primary-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>{po.poNumber}</span>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Vendor: <strong>{po.vendorId?.name}</strong>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      Total Amount: <strong>₹{(po.grandTotal || 0).toLocaleString('en-IN')}</strong> (incl. GST)
                    </div>
                    {po.deliveryDate && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Delivered: {new Date(po.deliveryDate).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    setSelectedPO(po);
                    setInvoiceForm({
                      dueDate: '',
                      paymentTerms: po.paymentTerms || 'Net 30',
                      notes: '',
                      buyerDetails: {
                        name: po.company || 'VendorBridge Corp',
                        address: po.deliveryAddress?.street || '',
                        city: po.deliveryAddress?.city || '',
                        state: po.deliveryAddress?.state || '',
                        pincode: po.deliveryAddress?.pincode || '',
                        gstNumber: '',
                        email: po.createdBy?.email || '',
                        phone: ''
                      }
                    });
                    setInvoiceModal(true);
                  }}>
                    Generate Invoice
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
        {selectedPO && (
          <div className="alert alert-info">Invoice will be generated for <strong>₹{(selectedPO.grandTotal||0).toLocaleString('en-IN')}</strong> (including {selectedPO.taxRate}% GST)</div>
        )}
      </Modal>
    </div>
  );
};

export default InvoiceList;
