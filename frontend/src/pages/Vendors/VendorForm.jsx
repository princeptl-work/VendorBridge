import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['IT & Technology','Manufacturing','Logistics','Services','Raw Materials','Construction','Healthcare','Food & Beverages','Other'];

const VendorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:'', category:'IT & Technology', gstNumber:'', contactPerson:'', email:'', phone:'', alternatePhone:'',
    notes:'', rating:0, status:'active',
    address:{ street:'', city:'', state:'', pincode:'', country:'India' },
    bankDetails:{ accountNumber:'', bankName:'', ifscCode:'', accountHolderName:'' }
  });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/vendors/${id}`).then(r => { const v = r.data.vendor; setForm({ name:v.name, category:v.category, gstNumber:v.gstNumber||'', contactPerson:v.contactPerson, email:v.email, phone:v.phone, alternatePhone:v.alternatePhone||'', notes:v.notes||'', rating:v.rating||0, status:v.status, address:v.address||{street:'',city:'',state:'',pincode:'',country:'India'}, bankDetails:v.bankDetails||{accountNumber:'',bankName:'',ifscCode:'',accountHolderName:''} }); setLoading(false); }).catch(() => { toast.error('Failed to load vendor'); navigate('/vendors'); });
    }
  }, [id]);

  const set = (k,v) => setForm(f => ({...f, [k]:v}));
  const setAddr = (k,v) => setForm(f => ({...f, address:{...f.address,[k]:v}}));
  const setBank = (k,v) => setForm(f => ({...f, bankDetails:{...f.bankDetails,[k]:v}}));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) { await api.put(`/vendors/${id}`, form); toast.success('Vendor updated'); }
      else { await api.post('/vendors', form); toast.success('Vendor added successfully'); }
      navigate('/vendors');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save vendor'); }
    setSaving(false);
  };

  if (loading) return <div className="page-loader"><div className="spinner"/></div>;

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div className="page-header">
        <div>
          <div className="page-title">{isEdit ? 'Edit Vendor' : 'Add New Vendor'}</div>
          <div className="page-subtitle">{isEdit ? 'Update vendor information' : 'Register a new vendor in the system'}</div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/vendors')}>← Back</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card mb-16">
          <div className="form-section-title">Basic Information</div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Vendor Name <span className="req">*</span></label>
              <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Company name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Category <span className="req">*</span></label>
              <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row cols-3">
            <div className="form-group">
              <label className="form-label">Contact Person <span className="req">*</span></label>
              <input className="form-control" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Contact name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email <span className="req">*</span></label>
              <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="vendor@company.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone <span className="req">*</span></label>
              <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" required />
            </div>
          </div>
          <div className="form-row cols-3">
            <div className="form-group">
              <label className="form-label">Alternate Phone</label>
              <input className="form-control" value={form.alternatePhone} onChange={e => set('alternatePhone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input className="form-control" value={form.gstNumber} onChange={e => set('gstNumber', e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" style={{ fontFamily:'monospace' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Rating (0-5)</label>
              <input className="form-control" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => set('rating', parseFloat(e.target.value))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows="3" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes about this vendor..." />
          </div>
        </div>

        <div className="card mb-16">
          <div className="form-section-title">Address</div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input className="form-control" value={form.address.street} onChange={e => setAddr('street', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-control" value={form.address.city} onChange={e => setAddr('city', e.target.value)} />
            </div>
          </div>
          <div className="form-row cols-3">
            <div className="form-group">
              <label className="form-label">State</label>
              <input className="form-control" value={form.address.state} onChange={e => setAddr('state', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input className="form-control" value={form.address.pincode} onChange={e => setAddr('pincode', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-control" value={form.address.country} onChange={e => setAddr('country', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card mb-16">
          <div className="form-section-title">Bank Details</div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Account Holder Name</label>
              <input className="form-control" value={form.bankDetails.accountHolderName} onChange={e => setBank('accountHolderName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input className="form-control" value={form.bankDetails.accountNumber} onChange={e => setBank('accountNumber', e.target.value)} />
            </div>
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input className="form-control" value={form.bankDetails.bankName} onChange={e => setBank('bankName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">IFSC Code</label>
              <input className="form-control" value={form.bankDetails.ifscCode} onChange={e => setBank('ifscCode', e.target.value.toUpperCase())} style={{ fontFamily:'monospace' }} />
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/vendors')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update Vendor' : 'Add Vendor'}</button>
        </div>
      </form>
    </div>
  );
};

export default VendorForm;
