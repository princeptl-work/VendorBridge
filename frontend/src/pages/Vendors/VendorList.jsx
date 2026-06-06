import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Building2, Edit, Settings, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['IT & Technology','Manufacturing','Logistics','Services','Raw Materials','Construction','Healthcare','Food & Beverages','Other'];

const VendorList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteModal, setDeleteModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:10 });
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (category) params.append('category', category);
      const res = await api.get(`/vendors?${params}`);
      setVendors(res.data.vendors || []);
      setPagination(res.data.pagination || {});
    } catch { toast.error('Failed to load vendors'); }
    setLoading(false);
  };

  useEffect(() => { fetchVendors(); }, [page, search, status, category]);

  const handleDelete = async () => {
    try {
      await api.delete(`/vendors/${deleteModal._id}`);
      toast.success('Vendor deleted');
      setDeleteModal(null);
      fetchVendors();
    } catch { toast.error('Failed to delete vendor'); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/vendors/${statusModal._id}/status`, { status: newStatus });
      toast.success('Status updated');
      setStatusModal(null);
      fetchVendors();
    } catch { toast.error('Failed to update status'); }
  };

  const stars = r => '★'.repeat(Math.round(r||0)) + '☆'.repeat(5-Math.round(r||0));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Vendors</div>
          <div className="page-subtitle">Manage your vendor database and relationships</div>
        </div>
        <div className="page-actions">
          {['admin', 'procurement_officer'].includes(user?.role) && (
            <Link to="/vendors/new" className="btn btn-primary">+ Add Vendor</Link>
          )}
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <span className="table-search-icon"><Search size={16} /></span>
            <input placeholder="Search vendors..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="table-filters">
            <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
            <select className="filter-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading ? <Loader /> : vendors.length === 0 ? (
          <div className="table-empty">
            <div className="table-empty-icon" style={{ color: 'var(--primary)' }}><Building2 size={48} /></div>
            <div className="table-empty-text">No vendors found</div>
            <div className="table-empty-sub">Add your first vendor to get started</div>
          </div>
        ) : (
          <table>
            <thead><tr>
              <th>Vendor</th><th>Category</th><th>Email / Phone</th>
              <th>GST Number</th><th>Rating</th><th>Status</th>
              {['admin', 'procurement_officer'].includes(user?.role) && <th>Actions</th>}
            </tr></thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v._id}>
                  <td>
                    <div style={{ fontWeight:600 }}>{v.name}</div>
                    {v.address?.city && <div style={{ fontSize:12, color:'var(--text-muted)' }}>{v.address.city}, {v.address.state}</div>}
                  </td>
                  <td><span style={{ fontSize:12, background:'var(--primary-100)', color:'var(--primary)', padding:'3px 8px', borderRadius:20, fontWeight:600 }}>{v.category}</span></td>
                  <td>
                    <div style={{ fontSize:13 }}>{v.email}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{v.phone}</div>
                  </td>
                  <td style={{ fontFamily:'monospace', fontSize:12 }}>{v.gstNumber || '—'}</td>
                  <td><span className="stars" style={{ fontSize:13 }}>{stars(v.rating)}</span></td>
                  <td><Badge status={v.status} /></td>
                  {['admin', 'procurement_officer'].includes(user?.role) && (
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/vendors/${v._id}/edit`)}><Edit size={16} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setStatusModal(v)}><Settings size={16} /></button>
                        {user?.role === 'admin' && (
                          <button className="btn btn-ghost btn-sm" style={{ color:'var(--danger)' }} onClick={() => setDeleteModal(v)}><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination.pages > 1 && (
          <div className="table-pagination">
            <span>Showing {vendors.length} of {pagination.total} vendors</span>
            <div className="pagination-btns">
              <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
              {Array.from({length: Math.min(pagination.pages, 5)}, (_, i) => i+1).map(p => (
                <button key={p} className={`pg-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="pg-btn" disabled={page === pagination.pages} onClick={() => setPage(p => p+1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Vendor" size="sm"
        footer={<><button className="btn btn-ghost" onClick={() => setDeleteModal(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></>}>
        <p>Are you sure you want to delete <strong>{deleteModal?.name}</strong>? This action cannot be undone.</p>
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={!!statusModal} onClose={() => setStatusModal(null)} title="Change Status" size="sm"
        footer={<button className="btn btn-ghost" onClick={() => setStatusModal(null)}>Close</button>}>
        <p style={{ marginBottom:16 }}>Change status for <strong>{statusModal?.name}</strong>:</p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {['active','inactive','blacklisted'].map(s => (
            <button key={s} className={`btn ${s==='active'?'btn-success':s==='blacklisted'?'btn-danger':'btn-ghost'}`}
              onClick={() => handleStatusChange(s)} style={{ justifyContent:'flex-start' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          {user?.role === 'admin' && (
            <>
              <div style={{ margin:'8px 0', borderTop:'1px solid var(--border)' }} />
              <button className="btn btn-danger" onClick={() => { setDeleteModal(statusModal); setStatusModal(null); }} style={{ justifyContent:'flex-start' }}>
                Remove Vendor
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default VendorList;
