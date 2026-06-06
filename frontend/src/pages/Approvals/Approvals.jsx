import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Check, X } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Approvals = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionModal, setActionModal] = useState(null); // { approval, type: 'approve'|'reject' }
  const [remarks, setRemarks] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit:20 });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/approvals?${params}`);
      setApprovals(res.data.approvals || []);
    } catch { toast.error('Failed to load approvals'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const handleAction = async () => {
    if (!actionModal) return;
    if (actionModal.type === 'reject' && !remarks.trim()) { toast.error('Remarks required for rejection'); return; }
    try {
      const endpoint = actionModal.type === 'approve' ? 'approve' : 'reject';
      await api.patch(`/approvals/${actionModal.approval._id}/${endpoint}`, { remarks });
      toast.success(actionModal.type === 'approve' ? 'Approval granted!' : 'Approval rejected');
      setActionModal(null); setRemarks('');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const grouped = { pending: approvals.filter(a=>a.status==='pending'), approved: approvals.filter(a=>a.status==='approved'), rejected: approvals.filter(a=>a.status==='rejected') };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Approval Workflow</div>
          <div className="page-subtitle">Review and process procurement approvals</div>
        </div>
        <div className="page-actions">
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {!statusFilter && (
        <div className="grid-3 mb-24">
          {[{k:'pending',label:'Pending',color:'#f0a500',bg:'#fff8e6'}, {k:'approved',label:'Approved',color:'#28a745',bg:'#e9f7ef'}, {k:'rejected',label:'Rejected',color:'#dc3545',bg:'#fde8ea'}].map(s => (
            <div key={s.k} onClick={() => setStatusFilter(s.k)} style={{ background:s.bg, border:`2px solid ${s.color}`, borderRadius:'var(--radius-lg)', padding:'20px', cursor:'pointer', textAlign:'center', transition:'var(--transition)' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              <div style={{ fontSize:32, fontWeight:800, color:s.color }}>{grouped[s.k].length}</div>
              <div style={{ fontSize:14, fontWeight:600, color:s.color }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <Loader /> : approvals.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'60px' }}>
          <div style={{ color:'var(--primary)' }}><CheckSquare size={48} /></div>
          <div style={{ fontSize:18, fontWeight:700, marginTop:16 }}>No approvals found</div>
          <div style={{ color:'var(--text-secondary)', marginTop:8 }}>All clear! No pending approvals.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {approvals.map(a => (
            <div key={a._id} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <span style={{ fontWeight:700, fontSize:16 }}>{a.title}</span>
                    <Badge status={a.status} />
                    <Badge status={a.priority} />
                  </div>
                  <div className="grid-3" style={{ gap:12, marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>RFQ</div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{a.rfqId?.rfqNumber || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>Vendor</div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{a.vendorId?.name || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>Amount</div>
                      <div style={{ fontWeight:800, fontSize:15, color:'var(--primary)' }}>₹{a.amount?.toLocaleString('en-IN') || '—'}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                    Requested by <strong>{a.requestedBy?.name}</strong> on {new Date(a.createdAt).toLocaleDateString('en-IN')}
                    {a.dueDate && ` • Due: ${new Date(a.dueDate).toLocaleDateString('en-IN')}`}
                  </div>
                  {a.remarks && (
                    <div style={{ marginTop:10, background:'var(--bg-page)', borderRadius:'var(--radius)', padding:'10px 12px', fontSize:13, color:'var(--text-secondary)', borderLeft:'3px solid var(--primary)' }}>
                      <strong>Remarks:</strong> {a.remarks}
                    </div>
                  )}
                  {/* Approval Timeline */}
                  {a.timeline?.length > 0 && (
                    <div className="timeline" style={{ marginTop:16 }}>
                      {a.timeline.map((t, i) => (
                        <div key={i} className="timeline-item">
                          <div className={`timeline-dot ${t.action}`} />
                          <div className="timeline-time">{new Date(t.timestamp).toLocaleString('en-IN')}</div>
                          <div className="timeline-title">{t.performerName} ({t.performerRole?.replace('_',' ')})</div>
                          <div className="timeline-desc">{t.remarks}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {a.status === 'pending' && user?.role === 'manager' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <button className="btn btn-success" onClick={() => { setActionModal({ approval:a, type:'approve' }); setRemarks(''); }} style={{ display:'flex', gap:6, alignItems:'center' }}><Check size={16} /> Approve</button>
                    <button className="btn btn-danger" onClick={() => { setActionModal({ approval:a, type:'reject' }); setRemarks(''); }} style={{ display:'flex', gap:6, alignItems:'center' }}><X size={16} /> Reject</button>
                    {a.rfqId && <Link to={`/rfqs/${a.rfqId._id}/compare`} className="btn btn-secondary btn-sm">View Details</Link>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!actionModal} onClose={() => setActionModal(null)}
        title={actionModal?.type === 'approve' ? <div style={{ display:'flex', gap:8, alignItems:'center' }}><Check size={20} /> Approve Request</div> : <div style={{ display:'flex', gap:8, alignItems:'center' }}><X size={20} /> Reject Request</div>}
        size="md"
        footer={<><button className="btn btn-ghost" onClick={() => setActionModal(null)}>Cancel</button>
          <button className={`btn ${actionModal?.type === 'approve' ? 'btn-success' : 'btn-danger'}`} onClick={handleAction}>
            {actionModal?.type === 'approve' ? 'Approve' : 'Reject'}
          </button></>}>
        <div style={{ marginBottom:16 }}>
          <strong>{actionModal?.approval?.title}</strong>
          {actionModal?.approval?.amount && <div style={{ marginTop:4, fontSize:15, fontWeight:700, color:'var(--primary)' }}>₹{actionModal?.approval?.amount?.toLocaleString('en-IN')}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Remarks {actionModal?.type === 'reject' && <span className="req">*</span>}</label>
          <textarea className="form-control" rows="3" value={remarks} onChange={e => setRemarks(e.target.value)}
            placeholder={actionModal?.type === 'approve' ? 'Optional remarks...' : 'Reason for rejection (required)...'} />
        </div>
      </Modal>
    </div>
  );
};

export default Approvals;
