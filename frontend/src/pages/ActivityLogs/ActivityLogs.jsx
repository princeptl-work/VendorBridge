import React, { useEffect, useState } from 'react';
import { Lock, Building2, ClipboardList, FileText, CheckCircle, ShoppingBag, Receipt, User, List, Search } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const MODULES = ['all','auth','vendor','rfq','quotation','approval','purchase_order','invoice','user'];
const MODULE_ICONS = { auth:<Lock size={16}/>, vendor:<Building2 size={16}/>, rfq:<ClipboardList size={16}/>, quotation:<FileText size={16}/>, approval:<CheckCircle size={16}/>, purchase_order:<ShoppingBag size={16}/>, invoice:<Receipt size={16}/>, user:<User size={16}/>, all:<List size={16}/> };

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:20 });
      if (module && module !== 'all') params.append('module', module);
      if (search) params.append('search', search);
      const res = await api.get(`/activity-logs?${params}`);
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination || {});
    } catch { toast.error('Failed to load logs'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page, module, search]);

  const getModuleColor = (m) => {
    const colors = { rfq:'var(--info)', quotation:'var(--primary)', approval:'var(--warning)', purchase_order:'var(--success)', invoice:'#6f42c1', vendor:'#e83e8c', auth:'var(--secondary)', user:'var(--text-secondary)' };
    return colors[m] || 'var(--text-muted)';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Activity Logs</div>
          <div className="page-subtitle">Complete audit trail of all procurement activities</div>
        </div>
      </div>

      {/* Module Tabs */}
      <div className="tabs" style={{ marginBottom:16 }}>
        {MODULES.map(m => (
          <button key={m} className={`tab ${module===m?'active':''}`} onClick={() => { setModule(m); setPage(1); }}>
            {MODULE_ICONS[m]} {m.charAt(0).toUpperCase() + m.slice(1).replace('_',' ')}
          </button>
        ))}
      </div>

      <div className="card">
        <div style={{ marginBottom:16 }}>
          <div className="table-search" style={{ maxWidth:'100%' }}>
            <span className="table-search-icon"><Search size={16} /></span>
            <input placeholder="Search logs by action, user, entity number..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ width:'100%', padding:'9px 12px 9px 36px', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:13, fontFamily:'var(--font)', outline:'none' }} />
          </div>
        </div>

        {loading ? <Loader /> : logs.length === 0 ? (
          <div className="table-empty"><div className="table-empty-icon" style={{ color: 'var(--primary)' }}><List size={48} /></div><div className="table-empty-text">No activity logs found</div></div>
        ) : (
          <div className="timeline">
            {logs.map((log, i) => (
              <div key={log._id} className="timeline-item">
                <div className="timeline-dot" style={{ background: getModuleColor(log.module) }} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                  <div>
                    <div className="timeline-time">{new Date(log.createdAt).toLocaleString('en-IN')}</div>
                    <div className="timeline-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span>{MODULE_ICONS[log.module]}</span>
                      <span>{log.action}</span>
                      {log.entityNumber && <span style={{ fontSize:12, background:'var(--primary-100)', color:'var(--primary)', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>{log.entityNumber}</span>}
                    </div>
                    <div className="timeline-desc">{log.description}</div>
                    {log.performerName && (
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
                        By: <strong>{log.performerName}</strong>
                        {log.performerRole && <span style={{ marginLeft:6, background:'var(--bg-page)', padding:'1px 6px', borderRadius:10, fontSize:11 }}>{log.performerRole.replace('_',' ')}</span>}
                      </div>
                    )}
                    {(log.previousStatus || log.newStatus) && (
                      <div style={{ fontSize:12, marginTop:4 }}>
                        {log.previousStatus && <span style={{ background:'var(--danger-bg)', color:'var(--danger)', padding:'2px 6px', borderRadius:10, fontSize:11, marginRight:6 }}>{log.previousStatus}</span>}
                        {log.newStatus && <><span style={{ color:'var(--text-muted)' }}>→</span><span style={{ background:'var(--success-bg)', color:'var(--success)', padding:'2px 6px', borderRadius:10, fontSize:11, marginLeft:6 }}>{log.newStatus}</span></>}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', background:'var(--primary-100)', padding:'3px 8px', borderRadius:10, fontWeight:600, textTransform:'capitalize', flexShrink:0 }}>{log.module?.replace('_',' ')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {pagination.pages > 1 && (
          <div className="table-pagination">
            <span>Showing {logs.length} of {pagination.total} logs</span>
            <div className="pagination-btns">
              <button className="pg-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
              {[...Array(Math.min(pagination.pages, 5))].map((_,i) => (
                <button key={i} className={`pg-btn ${page===i+1?'active':''}`} onClick={() => setPage(i+1)}>{i+1}</button>
              ))}
              <button className="pg-btn" disabled={page===pagination.pages} onClick={() => setPage(p=>p+1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
