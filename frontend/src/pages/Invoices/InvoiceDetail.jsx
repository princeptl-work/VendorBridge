import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Mail, CircleDollarSign, Printer, Download, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailModal, setEmailModal] = useState(false);
  const [paidModal, setPaidModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ recipientEmail:'', message:'' });
  const [paymentRef, setPaymentRef] = useState('');
  const [sending, setSending] = useState(false);
  const invoiceRef = useRef(null);

  const load = async () => {
    try { const res = await api.get(`/invoices/${id}`); setInvoice(res.data.invoice); }
    catch { toast.error('Invoice not found'); navigate('/invoices'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
      toast.dismiss();
      toast.success('PDF downloaded!');
    } catch { toast.dismiss(); toast.error('PDF generation failed'); }
  };

  const handleSendEmail = async () => {
    if (!emailForm.recipientEmail) { toast.error('Enter recipient email'); return; }
    setSending(true);
    try {
      await api.patch(`/invoices/${id}/send-email`, emailForm);
      toast.success('Invoice sent via email!');
      setEmailModal(false);
      load();
    } catch { toast.error('Failed to send email'); }
    setSending(false);
  };

  const handleMarkPaid = async () => {
    try {
      await api.patch(`/invoices/${id}/mark-paid`, { paymentReference: paymentRef });
      toast.success('Invoice marked as paid!');
      setPaidModal(false);
      load();
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return <Loader />;
  if (!invoice) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>
            <Link to="/invoices" style={{ color:'var(--primary)' }}>Invoices</Link> / {invoice.invoiceNumber}
          </div>
          <div className="page-title">{invoice.invoiceNumber}</div>
          <div style={{ marginTop:8 }}><Badge status={invoice.status} /></div>
        </div>
        <div className="page-actions">
          {['admin','procurement_officer'].includes(user?.role) && (
            <button className="btn btn-secondary" onClick={() => { setEmailForm({ recipientEmail: invoice.managerEmail || '', message:'' }); setEmailModal(true); }} style={{ display:'flex', gap:6, alignItems:'center' }}><Mail size={16} /> Send Email</button>
          )}
          {['admin','procurement_officer','manager'].includes(user?.role) && invoice.status !== 'paid' && (
            <button className="btn btn-success" onClick={() => setPaidModal(true)} style={{ display:'flex', gap:6, alignItems:'center' }}><CircleDollarSign size={16} /> Mark Paid</button>
          )}
          <button className="btn btn-ghost" onClick={handlePrint} style={{ display:'flex', gap:6, alignItems:'center' }}><Printer size={16} /> Print</button>
          <button className="btn btn-primary" onClick={handleDownloadPDF} style={{ display:'flex', gap:6, alignItems:'center' }}><Download size={16} /> Download PDF</button>
        </div>
      </div>

      {invoice.sentAt && (
        <div className="alert alert-info" style={{ marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
          <Mail size={16} /> Invoice sent to <strong>{invoice.sentTo}</strong> on {new Date(invoice.sentAt).toLocaleString('en-IN')}
        </div>
      )}
      {invoice.paidAt && (
        <div className="alert alert-success" style={{ marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
          <CheckCircle size={16} /> Invoice paid on {new Date(invoice.paidAt).toLocaleDateString('en-IN')}{invoice.paymentReference && ` • Ref: ${invoice.paymentReference}`}
        </div>
      )}

      {/* Invoice Template */}
      <div ref={invoiceRef} className="invoice-template">
        <div className="invoice-header">
          <div className="invoice-logo">
            <div className="invoice-logo-box">VB</div>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--primary)' }}>VendorBridge</div>
              <div style={{ fontSize:12, color:'var(--text-secondary)' }}>Procurement ERP System</div>
            </div>
          </div>
          <div className="invoice-meta">
            <div className="invoice-number">{invoice.invoiceNumber}</div>
            <div className="invoice-date">Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</div>
            {invoice.dueDate && <div className="invoice-date">Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</div>}
            <div style={{ marginTop:8 }}><Badge status={invoice.status} /></div>
          </div>
        </div>

        <div className="invoice-parties">
          <div>
            <div className="invoice-party-label">From (Vendor)</div>
            <div className="invoice-party-name">{invoice.vendorId?.name}</div>
            <div className="invoice-party-detail">
              {invoice.vendorId?.contactPerson}<br />
              {invoice.vendorId?.email}<br />
              {invoice.vendorId?.phone}<br />
              {invoice.vendorId?.gstNumber && <>GST: {invoice.vendorId.gstNumber}<br /></>}
              {invoice.vendorId?.address?.city && `${invoice.vendorId.address.city}, ${invoice.vendorId.address.state}`}
            </div>
          </div>
          <div>
            <div className="invoice-party-label">To (Buyer)</div>
            <div className="invoice-party-name">{invoice.buyerDetails?.name}</div>
            <div className="invoice-party-detail">
              {invoice.buyerDetails?.email && <>{invoice.buyerDetails.email}<br /></>}
              {invoice.buyerDetails?.phone && <>{invoice.buyerDetails.phone}<br /></>}
              {invoice.buyerDetails?.gstNumber && <>GST: {invoice.buyerDetails.gstNumber}<br /></>}
              {invoice.buyerDetails?.address}
            </div>
          </div>
        </div>

        {invoice.poId?.poNumber && (
          <div style={{ background:'var(--primary-100)', borderRadius:'var(--radius)', padding:'10px 16px', marginBottom:24, fontSize:13 }}>
            <strong>PO Reference:</strong> {invoice.poId.poNumber} &nbsp;|&nbsp; <strong>Payment Terms:</strong> {invoice.paymentTerms}
          </div>
        )}

        <table className="invoice-table">
          <thead><tr><th>#</th><th>Item Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
          <tbody>
            {invoice.items?.map((item, i) => (
              <tr key={i}>
                <td>{i+1}</td>
                <td>{item.name}{item.description && <div style={{ fontSize:11, opacity:.7 }}>{item.description}</div>}</td>
                <td>{item.quantity}</td>
                <td>₹{(item.unitPrice||0).toLocaleString('en-IN')}</td>
                <td style={{ fontWeight:600 }}>₹{(item.total||0).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-totals">
          <div className="invoice-totals-inner">
            <div className="invoice-total-row"><span>Subtotal</span><span>₹{(invoice.subTotal||0).toLocaleString('en-IN')}</span></div>
            <div className="invoice-total-row"><span>GST ({invoice.taxRate}%)</span><span>₹{(invoice.taxAmount||0).toLocaleString('en-IN')}</span></div>
            <div className="invoice-grand-total"><span>Total Due</span><span>₹{(invoice.grandTotal||0).toLocaleString('en-IN')}</span></div>
          </div>
        </div>

        {invoice.notes && (
          <div className="invoice-notes"><strong>Notes:</strong> {invoice.notes}</div>
        )}
        {invoice.vendorId?.bankDetails?.accountNumber && (
          <div className="invoice-notes">
            <strong>Bank Details:</strong> {invoice.vendorId.bankDetails.bankName} | A/C: {invoice.vendorId.bankDetails.accountNumber} | IFSC: {invoice.vendorId.bankDetails.ifscCode}
          </div>
        )}
        <div className="invoice-footer">
          <p>Thank you for your business! Generated by VendorBridge ERP System.</p>
          <p style={{ marginTop:4 }}>This is a computer-generated document. No signature required.</p>
        </div>
      </div>

      {/* Email Modal */}
      <Modal isOpen={emailModal} onClose={() => setEmailModal(false)} title={<div style={{ display:'flex', gap:8, alignItems:'center' }}><Mail size={20} /> Send Invoice via Email</div>} size="md"
        footer={<><button className="btn btn-ghost" onClick={() => setEmailModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSendEmail} disabled={sending}>{sending ? 'Sending...' : 'Send Email'}</button></>}>
        <div className="form-group">
          <label className="form-label">Recipient Email <span className="req">*</span></label>
          <input className="form-control" type="email" value={emailForm.recipientEmail} onChange={e => setEmailForm(f => ({...f, recipientEmail:e.target.value}))} placeholder="recipient@company.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea className="form-control" rows="3" value={emailForm.message} onChange={e => setEmailForm(f => ({...f, message:e.target.value}))} placeholder="Optional message to include in the email..." />
        </div>
        <div className="alert alert-info">Invoice {invoice.invoiceNumber} (₹{(invoice.grandTotal||0).toLocaleString('en-IN')}) will be sent as email.</div>
      </Modal>

      {/* Mark Paid Modal */}
      <Modal isOpen={paidModal} onClose={() => setPaidModal(false)} title={<div style={{ display:'flex', gap:8, alignItems:'center' }}><CircleDollarSign size={20} /> Mark as Paid</div>} size="sm"
        footer={<><button className="btn btn-ghost" onClick={() => setPaidModal(false)}>Cancel</button><button className="btn btn-success" onClick={handleMarkPaid}>Mark Paid</button></>}>
        <div className="form-group">
          <label className="form-label">Payment Reference</label>
          <input className="form-control" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="Transaction ID, UTR, etc." />
        </div>
      </Modal>
    </div>
  );
};

export default InvoiceDetail;
