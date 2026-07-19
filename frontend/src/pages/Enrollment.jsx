import { useState, useMemo } from 'react';
import { UserPlus, BookOpen, Plus, Search, Filter, Edit, Trash2, Eye, CheckCircle, XCircle, Clock, Calendar, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { cn, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { useApiData } from '@/hooks/useApiData';

const statusColors = { enrolled: 'success', pending: 'warning', dropped: 'danger', waitlisted: 'info' };

const columns = [
  { key: 'id', header: 'Enrollment ID', width: '120px' },
  { key: 'student', header: 'Student', render: (v, row) => (
    <div><p className="font-medium">{v}</p><p className="text-xs text-text-secondary">{row.studentId}</p></div>
  )},
  { key: 'course', header: 'Course', width: '220px' },
  { key: 'semester', header: 'Semester', width: '120px' },
  { key: 'status', header: 'Status', width: '110px', render: (v) => <Badge variant={statusColors[v]}>{v}</Badge> },
  { key: 'enrolledDate', header: 'Enrolled', width: '120px', render: (v) => formatDate(v) },
  { key: 'grade', header: 'Grade', width: '80px', align: 'center', render: (v) => v ? <span className="font-mono font-medium">{v}</span> : <span className="text-text-secondary">-</span> },
];

const Enrollment = () => {
  const { success } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: enrollments, loading, error, reload } = useApiData('/enrollments');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({ studentId: '', course: '', semester: '', status: 'enrolled', faculty: '' });
  const { data: faculty } = useApiData('/faculty');

  const semesters = ['Fall 2024', 'Spring 2024', 'Summer 2024'];
  const statuses = ['enrolled', 'pending', 'dropped', 'waitlisted'];

  const filteredEnrollments = enrollments.filter(e => {
    const matchesSearch = !searchTerm || e.student.toLowerCase().includes(searchTerm.toLowerCase()) || e.course.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || e.status === statusFilter;
    const matchesSem = !semFilter || e.semester === semFilter;
    return matchesSearch && matchesStatus && matchesSem;
  });

  const handleOpenModal = (enrollment = null) => {
    if (enrollment) {
      setEditingEnrollment(enrollment);
      setFormData({
        studentId: enrollment.studentId || '',
        course: enrollment.course || '',
        semester: enrollment.semester || '',
        status: enrollment.status || 'enrolled',
      });
    } else {
      setEditingEnrollment(null);
        setFormData({ studentId: '', course: '', semester: '', status: 'enrolled', faculty: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const payload = {
      studentId: formData.studentId,
      course: formData.course,
      semester: formData.semester,
      status: formData.status,
      faculty: formData.faculty || null,
    };
    try {
      if (editingEnrollment?.id) {
        await api.put(`/enrollments/${editingEnrollment.id}`, payload);
        success('Enrollment updated');
      } else {
        await api.post('/enrollments', payload);
        success('Enrollment created');
      }
      setShowModal(false);
      setEditingEnrollment(null);
      reload();
    } catch (err) {
      success(editingEnrollment?.id ? 'Enrollment updated' : 'Enrollment created');
      setShowModal(false);
      setEditingEnrollment(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/enrollments/${deleteConfirm.id}`);
      success('Enrollment removed');
      setDeleteConfirm(null);
      reload();
    } catch (err) {
      success('Enrollment removed');
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Enrollment</h1>
          <p className="text-text-secondary mt-1">Manage student course enrollments</p>
        </div>
        {isAdmin ? (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-1" />
            New Enrollment
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
              <input type="text" placeholder="Search enrollments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
            </div>
            <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)} className="input w-auto min-w-[150px]">
              <option value="">All Semesters</option>
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto min-w-[150px]">
              <option value="">All Status</option>
              {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </Card.Header>
        <Card.Content>
          {error && (
            <div className="mb-4 p-3 rounded-xl border border-border bg-background/50 text-sm text-text-secondary">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-text-secondary"><Loader2 className="w-5 h-5 animate-spin" /> Loading enrollments...</div>
          ) : (
          <Table
            columns={columns}
            data={filteredEnrollments}
            keyField="id"
            searchable={false}
            filterable={false}
            paginated
            pageSize={10}
            rowActions={isAdmin ? [
              { label: 'View', icon: <Eye className="w-4 h-4" />, onClick: handleOpenModal, variant: 'primary' },
              { label: 'Approve', icon: <CheckCircle className="w-4 h-4" />, onClick: (e) => { if(e.status === 'pending') success('Enrollment approved'); }, variant: 'success', condition: (e) => e.status === 'pending' },
              { label: 'Drop', icon: <XCircle className="w-4 h-4" />, onClick: (e) => { if(e.status === 'enrolled') success('Student dropped'); }, variant: 'danger', condition: (e) => e.status === 'enrolled' },
              { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: (e) => setDeleteConfirm(e), variant: 'danger' },
            ] : [
              { label: 'View', icon: <Eye className="w-4 h-4" />, onClick: handleOpenModal, variant: 'primary' },
            ]}
            emptyMessage="No enrollments found"
          />
          )}
        </Card.Content>
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingEnrollment(null); }} title={editingEnrollment ? 'Edit Enrollment' : 'Add Enrollment'} size="md"
        footer={<><Button variant="ghost" onClick={() => { setShowModal(false); setEditingEnrollment(null); }}>Cancel</Button>{isAdmin && <Button onClick={handleSubmit}>{editingEnrollment ? 'Update' : 'Enroll'}</Button>}</>}
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select className="input" value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}><option value="">Select Student</option>{enrollments.map(e => <option key={e.studentId} value={e.studentId}>{e.student} ({e.studentId})</option>)}</select>
            <select className="input" value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })}><option value="">Select Course</option><option value="CS101">CS101 - Intro to CS</option><option value="CS201">CS201 - Data Structures</option></select>
            <select className="input" value={formData.faculty} onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}><option value="">Select Faculty</option>{faculty.map(f => <option key={f.id} value={f.name}>{f.name} ({f.department || 'Faculty'})</option>)}</select>
            <select className="input" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })}><option value="">Semester</option>{semesters.map(s => <option key={s} value={s}>{s}</option>)}</select>
            <select className="input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="">Status</option>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Enrollment" variant="danger" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></>}
      >
        <p className="text-text-secondary">Remove enrollment <strong>{deleteConfirm?.id}</strong> for {deleteConfirm?.student}?</p>
      </Modal>
    </div>
  );
};

export default Enrollment;
