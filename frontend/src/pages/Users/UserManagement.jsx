import React, { useEffect, useState } from 'react';
import { Search, Users, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const ROLES = [
  { value:'admin', label:'Admin' },
  { value:'manager', label:'Manager' },
  { value:'procurement_officer', label:'Procurement Officer' },
  { value:'vendor', label:'Vendor' },
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'procurement_officer', phone:'', department:'', vendorId:'', isActive:true });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:10 });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || {});
    } catch { toast.error('Failed to load users'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page, search, roleFilter]);

  const openCreate = () => { setForm({ name:'', email:'', password:'', role:'procurement_officer', phone:'', department:'', vendorId:'', isActive:true }); setEditUser(null); setModal('create'); };
  const openEdit = (u) => { setForm({ name:u.name, email:u.email, password:'', role:u.role, phone:u.phone||'', department:u.department||'', vendorId:u.vendorId?._id||'', isActive:u.isActive }); setEditUser(u); setModal('edit'); };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    if (modal === 'create' && !form.password) { toast.error('Password required'); return; }
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/auth/register', form);
        toast.success('User created');
      } else {
        const payload = { ...form }; if (!payload.password) delete payload.password;
        await api.put(`/users/${editUser._id}`, payload);
        toast.success('User updated');
      }
      setModal(null); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setSaving(false);
  };

  const handleToggleStatus = async (u) => {
    try { await api.patch(`/users/${u._id}/toggle-status`); toast.success('Status toggled'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.name}"?`)) return;
    try { await api.delete(`/users/${u._id}`); toast.success('User deleted'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const roleColors = { admin:'badge-danger', manager:'badge-warning', procurement_officer:'badge-primary', vendor:'badge-info' };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-subtitle">Manage system users and their roles</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
      </div>
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <span className="table-search-icon"><Search size={16} /></span>
            <input placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="filter-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        {loading ? <Loader /> : users.length === 0 ? (
          <div className="table-empty"><div className="table-empty-icon" style={{ color: 'var(--primary)' }}><Users size={48} /></div><div className="table-empty-text">No users found</div></div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Vendor</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, background:'var(--primary)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13, flexShrink:0 }}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div style={{ fontWeight:600 }}>{u.name}</div>
                    </div>
                  </td>
                  <td style={{ color:'var(--text-secondary)' }}>{u.email}</td>
                  <td><span className={`badge ${roleColors[u.role]||'badge-secondary'}`}>{u.role?.replace('_',' ')}</span></td>
                  <td>{u.department || '—'}</td>
                  <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{u.vendorId?.name || '—'}</td>
                  <td style={{ fontSize:12, color:'var(--text-muted)' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}</td>
                  <td>
                    <button onClick={() => handleToggleStatus(u)} style={{ border:'none', background:'none', cursor:'pointer', padding:'3px 0' }}>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}><Edit size={16} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ color:'var(--danger)' }} onClick={() => handleDelete(u)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pagination.pages > 1 && (
          <div className="table-pagination">
            <span>Showing {users.length} of {pagination.total}</span>
            <div className="pagination-btns">
              <button className="pg-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
              <button className="pg-btn" disabled={page===pagination.pages} onClick={() => setPage(p=>p+1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal==='create' ? 'Add New User' : 'Edit User'} size="md"
        footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : modal==='create' ? 'Create User' : 'Update User'}</button></>}>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Full Name <span className="req">*</span></label>
            <input className="form-control" value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))} placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label className="form-label">Role <span className="req">*</span></label>
            <select className="form-control" value={form.role} onChange={e => setForm(f => ({...f,role:e.target.value}))}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email <span className="req">*</span></label>
          <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))} placeholder="user@company.com" />
        </div>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Password {modal==='edit' && <span style={{ fontSize:11, color:'var(--text-muted)' }}>(leave blank to keep)</span>}</label>
            <input className="form-control" type="password" value={form.password} onChange={e => setForm(f => ({...f,password:e.target.value}))} placeholder="Min 6 characters" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-control" value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))} placeholder="+91 9876543210" />
          </div>
        </div>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-control" value={form.department} onChange={e => setForm(f => ({...f,department:e.target.value}))} placeholder="Procurement" />
          </div>
        </div>
        {modal === 'edit' && (
          <div className="form-group">
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({...f,isActive:e.target.checked}))} />
              <span className="form-label" style={{ marginBottom:0 }}>Account Active</span>
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
