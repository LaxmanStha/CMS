import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search, UserPlus, Edit, Trash2,
  Loader2, RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import StatusDropdown from '@/components/ui/StatusDropdown';
import Dropdown from '@/components/ui/Dropdown';

const STATUSES = ['active', 'inactive', 'pending', 'graduated'];

const Students = () => {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [classroomsLoading, setClassroomsLoading] = useState(true);
  const [classroomsError, setClassroomsError] = useState('');
  const [revealed, setRevealed] = useState({});

  const toggleReveal = (id) => setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));

  const baseColumns = [
    { key: 'id', header: 'Student ID', width: '100px', render: (val) => val != null ? `STU${String(val).padStart(3, '0')}` : '-' },
    { key: 'name', header: 'Name', render: (val, row) => (
      <div className="flex items-center gap-3">
        <div className="avatar avatar-sm bg-primary/10 text-primary">{getInitials(row.name || '?')}</div>
        <div>
          <p className="font-medium text-text-primary">{row.name}</p>
          <p className="text-xs text-text-secondary">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'program', header: 'Department', width: '180px', render: (val) => val || '-' },
    { key: 'phone', header: 'Phone', width: '140px', render: (val) => val || '-' },
    { key: 'classroom', header: 'Classroom', width: '120px', render: (val, row) => (val || row?.section || '-') },
    { key: 'year', header: 'Semester', width: '80px', render: (val) => val ? `Semester ${val}` : '-' },
    { key: 'status', header: 'Status', width: '120px', render: (val) => {
      const status = val || 'active';
      return (
        <Badge variant={status === 'active' ? 'success' : status === 'graduated' ? 'info' : status === 'pending' ? 'warning' : 'default'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    }},
  ];

  const passwordColumn = {
    key: 'password',
    header: 'Password',
    width: '160px',
    render: (val, row) => (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{revealed[row.id] ? (row.password || '—') : '••••••'}</span>
        {row.password && (
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => toggleReveal(row.id)}
          >
            {revealed[row.id] ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
    ),
  };

  const columns = isAdmin ? [...baseColumns, passwordColumn] : baseColumns;
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', program: '', section: '', classroom: '', year: 1, status: 'active' });

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError('');
      const res = await api.get('/students');
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setFetchError(err.response?.data?.message || err.response?.data || 'Failed to load students');
      showErrorRef.current('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    let cancelled = false;
    const loadClassrooms = async () => {
      try {
        setClassroomsLoading(true);
        setClassroomsError('');
        const res = await api.get('/classrooms');
        if (!cancelled) setClassrooms(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) {
          setClassrooms([]);
          setClassroomsError('Unable to load rooms');
        }
      } finally {
        if (!cancelled) setClassroomsLoading(false);
      }
    };
    loadClassrooms();
    return () => { cancelled = true; };
  }, []);

  const programs = useMemo(() => [...new Set(students.map(s => s.program).filter(Boolean))], [students]);
  const roomNumbers = useMemo(() => (
    [...new Set(classrooms.map((classroom) => String(classroom.room_number || '').trim()).filter(Boolean))]
  ), [classrooms]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = !searchTerm ||
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(student.id).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || (student.status || 'active') === statusFilter;
      const matchesProgram = !programFilter || student.program === programFilter;
      return matchesSearch && matchesStatus && matchesProgram;
    });
  }, [students, searchTerm, statusFilter, programFilter]);

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name || '',
        email: student.email || '',
        password: '', // never pre-fill password for security
        phone: student.phone || '',
        program: student.program || '',
        section: student.section || '',
        classroom: student.classroom || '',
        year: student.year || 1,
        status: student.status || 'active',
      });
    } else {
      setEditingStudent(null);
      setFormData({ name: '', email: '', password: '', phone: '', program: '', section: '', classroom: '', year: 1, status: 'active' });
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
        password: formData.password, // send even if empty; backend handles fallback
        phone: formData.phone,
        program: formData.program,
        section: formData.classroom,
        classroom: formData.classroom,
        year: Number(formData.year),
        status: formData.status,
      };
      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, payload);
        success('Student updated successfully');
      } else {
        await api.post('/students', payload);
        success('New student added successfully');
      }
      setShowModal(false);
      await fetchStudents();
    } catch (err) {
      showError(err.response?.data?.message || err.response?.data || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (student) => {
    setDeleteConfirm(student);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/students/${deleteConfirm.id}`);
      success(`${deleteConfirm.name} has been removed`);
      setDeleteConfirm(null);
      await fetchStudents();
    } catch (err) {
      showError(err.response?.data?.message || err.response?.data || 'Failed to delete student');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Students</h1>
          <p className="text-text-secondary mt-1">Manage student records and enrollment</p>
        </div>
        {isAdmin ? (
          <Button onClick={() => handleOpenModal()} className="whitespace-nowrap">
            <UserPlus className="w-4 h-4 mr-1" />
            Add Student
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
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <StatusDropdown value={statusFilter} onChange={setStatusFilter} options={STATUSES} />
            <Dropdown value={programFilter} onChange={setProgramFilter} options={programs} placeholder="All Programs" />
          </div>
          <div className="flex items-center gap-2">
          </div>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading students...
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-danger">{fetchError}</p>
              <Button variant="outline" size="sm" onClick={fetchStudents}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </div>
          ) : (
          <Table
            columns={columns}
            data={filteredStudents}
            keyField="id"
            searchable={false}
            filterable={false}
            paginated
            pageSize={10}
            rowActions={isAdmin ? [
              { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: (row) => handleOpenModal(row), variant: 'ghost' },
              { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: handleDelete, variant: 'danger' },
            ] : [
            ]}
            emptyMessage="No students found matching your criteria"
          />
          )}
        </Card.Content>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            {isAdmin && (
              <Button onClick={handleSubmit} loading={saving}>{editingStudent ? 'Update' : 'Create'}</Button>
            )}
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Login password (optional)" />
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            <select
              value={formData.program}
              onChange={(e) => setFormData({...formData, program: e.target.value})}
              className="select-themed"
              required
            >
              <option value="">Select Department</option>
              {programs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <Input label="Semester" type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || 1})} min={1} max={5} required />
            <label className="block text-sm font-medium text-text-primary">
              Classroom (Room No)
              <select
                value={formData.classroom}
                onChange={(e) => setFormData({...formData, classroom: e.target.value})}
                className="select-themed mt-1.5 w-full"
                disabled={classroomsLoading || !!classroomsError}
              >
                <option value="">
                  {classroomsLoading ? 'Loading rooms...' : classroomsError ? classroomsError : roomNumbers.length ? 'Select Room Number' : 'No rooms available'}
                </option>
                {roomNumbers.map((roomNumber) => (
                  <option key={roomNumber} value={roomNumber}>{roomNumber}</option>
                ))}
              </select>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="select-themed"
              required
            >
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Student"
        variant="danger"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-text-secondary">
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong> (STU{String(deleteConfirm?.id).padStart(3, '0')})?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Students;
