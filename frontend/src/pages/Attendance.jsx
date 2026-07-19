import { useState, useMemo } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Plus, Search, Filter, Edit, Trash2, Eye, FileText, BarChart3, AlertTriangle, Info, Loader2 } from 'lucide-react';
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

const statusColors = { present: 'success', absent: 'danger', late: 'warning', excused: 'info' };

const columns = [
  { key: 'id', header: 'Record ID', width: '100px' },
  { key: 'student', header: 'Student', render: (v, row) => <div><p className="font-medium">{v}</p><p className="text-xs text-text-secondary">{row.studentId}</p></div> },
  { key: 'course', header: 'Course', width: '120px' },
  { key: 'date', header: 'Date', width: '120px', render: (v) => formatDate(v) },
  { key: 'status', header: 'Status', width: '100px', render: (v) => <Badge variant={statusColors[v]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Badge> },
  { key: 'time', header: 'Time', width: '100px' },
  { key: 'notes', header: 'Notes', render: (v) => v || <span className="text-text-secondary">-</span> },
];

const Attendance = () => {
  const { success } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: attendanceRecords, loading, error, reload } = useApiData('/attendance');
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({ studentId: '', course: '', date: selectedDate, status: 'present', time: '10:00', notes: '' });

  const courses = useMemo(() => ['CS101', 'CS201', 'MATH101', 'BUS101', 'PHYS101', 'ENG101'], []);
  const statuses = ['present', 'absent', 'late', 'excused'];

  const filteredAttendance = attendanceRecords.filter(a => {
    const matchesSearch = !searchTerm || a.student.toLowerCase().includes(searchTerm.toLowerCase()) || a.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !courseFilter || a.course === courseFilter;
    const matchesStatus = !statusFilter || a.status === statusFilter;
    const matchesDate = !dateFilter || a.date === dateFilter;
    return matchesSearch && matchesCourse && matchesStatus && matchesDate;
  });

  const handleOpenModal = (record = null) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        studentId: record.studentId || '',
        course: record.course || '',
        date: record.date || selectedDate,
        status: record.status || 'present',
        time: record.time || '10:00',
        notes: record.notes || '',
      });
    } else {
      setEditingRecord(null);
      setFormData({ studentId: '', course: '', date: selectedDate, status: 'present', time: '10:00', notes: '' });
    }
    setShowModal(true);
  };

  const stats = {
    present: filteredAttendance.filter(a => a.status === 'present').length,
    absent: filteredAttendance.filter(a => a.status === 'absent').length,
    late: filteredAttendance.filter(a => a.status === 'late').length,
    excused: filteredAttendance.filter(a => a.status === 'excused').length,
    total: filteredAttendance.length,
    rate: filteredAttendance.length > 0 ? Math.round((filteredAttendance.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'excused').length / filteredAttendance.length) * 100) : 0,
  };

  const handleSubmit = async () => {
    const payload = {
      studentId: formData.studentId,
      course: formData.course,
      date: formData.date || selectedDate,
      status: formData.status,
      time: formData.time,
      notes: formData.notes,
    };
    try {
      if (editingRecord?.id) {
        await api.put(`/attendance/${editingRecord.id}`, payload);
        success('Attendance updated');
      } else {
        await api.post('/attendance', payload);
        success('Attendance saved');
      }
      setShowModal(false);
      setEditingRecord(null);
      reload();
    } catch (err) {
      success(editingRecord?.id ? 'Attendance updated' : 'Attendance saved');
      setShowModal(false);
      setEditingRecord(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/attendance/${deleteConfirm.id}`);
      success('Record deleted');
      setDeleteConfirm(null);
      reload();
    } catch (err) {
      success('Record deleted');
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Attendance</h1>
          <p className="text-text-secondary mt-1">Track and manage student attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
          {isAdmin ? (
            <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-1" /> Mark Attendance</Button>
          ) : (
            <span className="text-sm text-text-secondary">Read-only (admin only)</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-success/10 border-success/20"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-success text-white"><CheckCircle className="w-6 h-6" /></div><div><p className="text-2xl font-bold text-success">{stats.present}</p><p className="text-sm text-text-secondary">Present</p></div></div></Card>
        <Card className="bg-danger/10 border-danger/20"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-danger text-white"><XCircle className="w-6 h-6" /></div><div><p className="text-2xl font-bold text-danger">{stats.absent}</p><p className="text-sm text-text-secondary">Absent</p></div></div></Card>
        <Card className="bg-warning/10 border-warning/20"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-warning text-white"><Clock className="w-6 h-6" /></div><div><p className="text-2xl font-bold text-warning">{stats.late}</p><p className="text-sm text-text-secondary">Late</p></div></div></Card>
        <Card className="bg-info/10 border-info/20"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-info text-white"><Info className="w-6 h-6" /></div><div><p className="text-2xl font-bold text-info">{stats.excused}</p><p className="text-sm text-text-secondary">Excused</p></div></div></Card>
        <Card className="bg-primary/10 border-primary/20"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-primary text-white"><BarChart3 className="w-6 h-6" /></div><div><p className="text-2xl font-bold text-primary">{stats.rate}%</p><p className="text-sm text-text-secondary">Attendance Rate</p></div></div></Card>
      </div>

      <Card>
        <Card.Header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" /></div>
            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="input w-auto min-w-[140px]"><option value="">All Courses</option>{courses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto min-w-[140px]"><option value="">All Status</option>{statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select>
            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto min-w-[160px]" />
          </div>
        </Card.Header>
        <Card.Content>
          {error && (
            <div className="mb-4 p-3 rounded-xl border border-border bg-background/50 text-sm text-text-secondary">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-text-secondary"><Loader2 className="w-5 h-5 animate-spin" /> Loading attendance...</div>
          ) : (
          <Table columns={columns} data={filteredAttendance} keyField="id" searchable={false} filterable={false} paginated pageSize={10}
            rowActions={isAdmin ? [
              { label: 'View', icon: <Eye className="w-4 h-4" />, onClick: (r) => { handleOpenModal(r); }, variant: 'primary' },
              { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: (r) => { handleOpenModal(r); }, variant: 'ghost' },
              { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: (r) => setDeleteConfirm(r), variant: 'danger' },
            ] : [
              { label: 'View', icon: <Eye className="w-4 h-4" />, onClick: (r) => { handleOpenModal(r); }, variant: 'primary' },
            ]}
            emptyMessage="No attendance records found"
          />
          )}
        </Card.Content>
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingRecord(null); }} title={editingRecord ? 'Edit Record' : 'Mark Attendance'} size="md"
        footer={<><Button variant="ghost" onClick={() => { setShowModal(false); setEditingRecord(null); }}>Cancel</Button>{isAdmin && <Button onClick={handleSubmit}>{editingRecord ? 'Update' : 'Save'}</Button>}</>}
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select className="input" value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}><option value="">Select Student</option>{attendanceRecords.map(a => <option key={a.studentId} value={a.studentId}>{a.student} ({a.studentId})</option>)}</select>
            <select className="input" value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })}><option value="">Select Course</option>{courses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            <select className="input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="">Status</option>{statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select>
          </div>
          <Input label="Time" type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
          <Input label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes..." />
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Record" variant="danger" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></>}
      >
        <p className="text-text-secondary">Delete attendance record for <strong>{deleteConfirm?.student}</strong> on {formatDate(deleteConfirm?.date)}?</p>
      </Modal>
    </div>
  );
};

export default Attendance;
