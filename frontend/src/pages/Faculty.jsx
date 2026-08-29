import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { formatDate, getInitials } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

const STATUSES = ['active', 'on_leave', 'inactive'];

const statusLabel = (s) => s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

const columns = [
  { key: 'id', header: 'Faculty ID', width: '100px', render: (val) => val != null ? `FAC${String(val).padStart(3, '0')}` : '-' },
  { key: 'name', header: 'Name', render: (val, row) => (
    <div className="flex items-center gap-3">
      <div className="avatar avatar-sm bg-primary/10 text-primary">{getInitials(row.name || '?')}</div>
      <div>
        <p className="font-medium text-text-primary">{row.name}</p>
        <p className="text-xs text-text-secondary">{row.email}</p>
      </div>
    </div>
  )},
  { key: 'department', header: 'Department', width: '150px', render: (val) => val || '-' },
  { key: 'phone', header: 'Phone', width: '140px', render: (val) => val || '-' },
  { key: 'status', header: 'Status', width: '120px', render: (val) => {
    const status = val || 'active';
    return (
      <Badge variant={status === 'active' ? 'success' : status === 'on_leave' ? 'warning' : 'default'}>
        {statusLabel(status)}
      </Badge>
    );
  }},
  { key: 'password', header: 'Password', width: '120px', render: (val) => val || '-' },
  { key: 'hireDate', header: 'Hired', width: '120px', render: (val) => formatDate(val) },
];

const Faculty = () => {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', department: '', status: 'active', hireDate: '', password: '' });

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty');
      setFaculty(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showError('Failed to load faculty');
      setFaculty([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const departments = useMemo(() => [...new Set(faculty.map(f => f.department).filter(Boolean))], [faculty]);

  const filteredFaculty = useMemo(() => faculty.filter(f => {
    const matchesSearch = !searchTerm ||
      f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(f.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !deptFilter || f.department === deptFilter;
    const matchesStatus = !statusFilter || (f.status || 'active') === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  }), [faculty, searchTerm, deptFilter, statusFilter]);

  const handleOpenModal = (f = null) => {
    if (f) {
      setEditingFaculty(f);
      setFormData({
        name: f.name || '',
        email: f.email || '',
        phone: f.phone || '',
        department: f.department || '',
        status: f.status || 'active',
        hireDate: f.hireDate || '',
        password: '', // never pre-fill password for security
      });
    } else {
      setEditingFaculty(null);
      setFormData({ name: '', email: '', phone: '', department: '', status: 'active', hireDate: '', password: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        status: formData.status,
        hireDate: formData.hireDate,
      };
      if (editingFaculty) {
        await api.put(`/faculty/${editingFaculty.id}`, payload);
        success('Faculty updated successfully');
      } else {
        payload.password = formData.password;
        await api.post('/faculty', payload);
        success('Faculty added successfully');
      }
      setShowModal(false);
      await fetchFaculty();
    } catch (err) {
      showError(err.response?.data?.message || err.response?.data || 'Failed to save faculty');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (f) => setDeleteConfirm(f);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/faculty/${deleteConfirm.id}`);
      success(`${deleteConfirm.name} has been removed`);
      setDeleteConfirm(null);
      await fetchFaculty();
    } catch (err) {
      showError(err.response?.data?.message || err.response?.data || 'Failed to delete faculty');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Faculty</h1>
          <p className="text-text-secondary mt-1">Manage faculty members and their assignments</p>
        </div>
        {isAdmin ? (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Faculty
          </Button>
        ) : (
          <span className="text-sm text-text-secondary">Read-only (admin only)</span>
        )}
      </div>

      <Card>
        <Card.Header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="input w-auto min-w-[150px]">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto min-w-[150px]">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>
        </Card.Header>
        <Card.Content>
          <Table
            columns={columns}
            data={filteredFaculty}
            keyField="id"
            searchable={false}
            filterable={false}
            paginated
            pageSize={10}
            loading={loading}
            rowActions={isAdmin ? [
              { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: handleOpenModal, variant: 'ghost' },
              { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: handleDelete, variant: 'danger' },
            ] : []}
            emptyMessage={'No faculty members found'}
          />
        </Card.Content>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingFaculty ? 'Edit Faculty' : 'Add Faculty'} size="lg"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>{isAdmin && <Button onClick={handleSubmit} loading={saving}>{editingFaculty ? 'Update' : 'Create'}</Button>}</>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Dr. John Smith" required />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="prof@college.edu" required />
            <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Set initial password" />
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1-555-0000" />
            <select className="select-themed" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Engineering">Engineering</option>
              <option value="Business">Business</option>
              <option value="Physics">Physics</option>
              <option value="Psychology">Psychology</option>
            </select>
            <select className="select-themed" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
              {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
            <Input label="Hire Date" type="date" value={formData.hireDate} onChange={(e) => setFormData({...formData, hireDate: e.target.value})} />
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Faculty" variant="danger" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></>}
      >
        <p className="text-text-secondary">Delete <strong>{deleteConfirm?.name}</strong> (FAC{String(deleteConfirm?.id).padStart(3, '0')})? This cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Faculty;

