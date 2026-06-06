import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RFQForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', deadline: '', priority: 'medium', notes: '',
    vendors: [], items: [{ name:'', description:'', quantity:1, unit:'units', estimatedUnitPrice:0 }],
    attachments: []
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/vendors?limit=100&status=active').then(r => setVendors(r.data.vendors || [])).catch(() => {});
    if (isEdit) {
      setLoading(true);
      api.get(`/rfqs/${id}`).then(r => {
        const rfq = r.data.rfq;
        setForm({ title:rfq.title, description:rfq.description||'', deadline:rfq.deadline?.slice(0,10), priority:rfq.priority, notes:rfq.notes||'', vendors:rfq.vendors.map(v=>v._id), items:rfq.items.map(i=>({name:i.name,description:i.description||'',quantity:i.quantity,unit:i.unit,estimatedUnitPrice:i.estimatedUnitPrice||0})), attachments: rfq.attachments || [] });
        setLoading(false);
      }).catch(() => { toast.error('Failed to load RFQ'); navigate('/rfqs'); });
    }
  }, [id]);

  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(f => ({
        ...f,
        attachments: [...(f.attachments || []), { name: res.data.name, url: res.data.url }]
      }));
      toast.success('File uploaded successfully!');
    } catch {
      toast.error('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setForm(f => ({
      ...f,
      attachments: (f.attachments || []).filter((_, idx) => idx !== index)
    }));
  };
  const setItem = (i,k,v) => setForm(f => { const items=[...f.items]; items[i]={...items[i],[k]:v}; return {...f,items}; });
  const addItem = () => setForm(f => ({...f, items:[...f.items,{name:'',description:'',quantity:1,unit:'units',estimatedUnitPrice:0}]}));
  const removeItem = i => setForm(f => ({...f, items:f.items.filter((_,idx)=>idx!==i)}));

  const toggleVendor = (vid) => setForm(f => ({...f, vendors: f.vendors.includes(vid) ? f.vendors.filter(v=>v!==vid) : [...f.vendors, vid]}));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.items.every(i => i.name && i.quantity > 0)) { toast.error('Fill all item names and quantities'); return; }
    setSaving(true);
    try {
      if (isEdit) { await api.put(`/rfqs/${id}`, form); toast.success('RFQ updated'); }
      else { await api.post('/rfqs', form); toast.success('RFQ created successfully'); }
      navigate('/rfqs');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save RFQ'); }
    setSaving(false);
  };

  if (loading) return <div className="page-loader"><div className="spinner"/></div>;

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div className="page-header">
        <div>
          <div className="page-title">{isEdit ? 'Edit RFQ' : 'Create New RFQ'}</div>
          <div className="page-subtitle">Define your procurement requirements</div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/rfqs')}>← Back</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card mb-16">
          <div className="form-section-title">RFQ Details</div>
          <div className="form-group">
            <label className="form-label">RFQ Title <span className="req">*</span></label>
            <input className="form-control" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g., Office Furniture Procurement Q1 2024" required />
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Deadline <span className="req">*</span></label>
              <input className="form-control" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} min={new Date().toISOString().slice(0,10)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows="3" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed description of your requirements..." />
          </div>
          <div className="form-group">
            <label className="form-label">Additional Notes</label>
            <textarea className="form-control" rows="2" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Attachments</label>
            <input className="form-control" type="file" onChange={handleFileUpload} disabled={uploading} />
            {uploading && <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4 }}>Uploading...</div>}
            
            {form.attachments?.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {form.attachments.map((att, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-page)', padding: '6px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{att.name}</a>
                    <button type="button" onClick={() => removeAttachment(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card mb-16">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div className="form-section-title" style={{ marginBottom:0 }}>Items / Products</div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:'var(--bg-page)' }}>
                <th style={{ padding:'10px 12px', textAlign:'left', fontSize:12, fontWeight:700, color:'var(--text-secondary)', borderBottom:'1px solid var(--border)' }}>Item Name *</th>
                <th style={{ padding:'10px 12px', textAlign:'left', fontSize:12, fontWeight:700, color:'var(--text-secondary)', borderBottom:'1px solid var(--border)' }}>Description</th>
                <th style={{ padding:'10px 12px', textAlign:'left', fontSize:12, fontWeight:700, color:'var(--text-secondary)', borderBottom:'1px solid var(--border)', width:90 }}>Qty *</th>
                <th style={{ padding:'10px 12px', textAlign:'left', fontSize:12, fontWeight:700, color:'var(--text-secondary)', borderBottom:'1px solid var(--border)', width:90 }}>Unit</th>
                <th style={{ padding:'10px 12px', textAlign:'left', fontSize:12, fontWeight:700, color:'var(--text-secondary)', borderBottom:'1px solid var(--border)', width:120 }}>Est. Price</th>
                <th style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)', width:40 }}></th>
              </tr></thead>
              <tbody>
                {form.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--border-light)' }}>
                    <td style={{ padding:'8px 12px' }}><input className="form-control" value={item.name} onChange={e => setItem(i,'name',e.target.value)} placeholder="Item name" required /></td>
                    <td style={{ padding:'8px 12px' }}><input className="form-control" value={item.description} onChange={e => setItem(i,'description',e.target.value)} placeholder="Optional" /></td>
                    <td style={{ padding:'8px 12px' }}><input className="form-control" type="number" min="1" value={item.quantity} onChange={e => setItem(i,'quantity',+e.target.value)} /></td>
                    <td style={{ padding:'8px 12px' }}><input className="form-control" value={item.unit} onChange={e => setItem(i,'unit',e.target.value)} /></td>
                    <td style={{ padding:'8px 12px' }}><input className="form-control" type="number" min="0" value={item.estimatedUnitPrice} onChange={e => setItem(i,'estimatedUnitPrice',+e.target.value)} placeholder="₹" /></td>
                    <td style={{ padding:'8px 12px' }}>
                      {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--danger)', fontSize:18 }}>✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card mb-16">
          <div className="form-section-title">Assign Vendors</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:12 }}>Select vendors to receive this RFQ ({form.vendors.length} selected)</div>
          {vendors.length === 0 ? <div style={{ color:'var(--text-muted)', fontSize:13 }}>No active vendors found. <a href="/vendors/new">Add vendors first.</a></div> :
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10, maxHeight:280, overflowY:'auto' }}>
            {vendors.map(v => {
              const sel = form.vendors.includes(v._id);
              return (
                <div key={v._id} onClick={() => toggleVendor(v._id)}
                  style={{ border:`2px solid ${sel?'var(--primary)':'var(--border)'}`, borderRadius:'var(--radius)', padding:'12px', cursor:'pointer', background:sel?'var(--primary-100)':'white', transition:'var(--transition)' }}>
                  <div style={{ fontWeight:600, fontSize:13, color:sel?'var(--primary)':'var(--text-primary)' }}>{v.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{v.category}</div>
                  {sel && <div style={{ fontSize:11, color:'var(--primary)', fontWeight:700, marginTop:4 }}>✓ Selected</div>}
                </div>
              );
            })}
          </div>}
        </div>

        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/rfqs')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update RFQ' : 'Create RFQ'}</button>
        </div>
      </form>
    </div>
  );
};

export default RFQForm;
