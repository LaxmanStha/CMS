import { useState, useMemo, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Plus, BarChart3, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { cn, formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { useApiData } from '@/hooks/useApiData';

const statusColors = { present: 'success', absent: 'danger', late: 'warning', excused: 'info' };

const columns = [
  { key: 'id', header: 'ID', width: '80px', sortable: true },
  { key: 'student', header: 'Student', render: (v, row) => (
    <div>
      <p className="font-medium text-text-primary">{v}</p>
      <p className="text-xs text-text-secondary">{row.studentId}</p>
    </div>
  )},
  { key: 'classroom', header: 'Classroom', width: '120px', render: (v) => v || '-' },
  { key: 'course', header: 'Course', width: '120px', sortable: true },
  { key: 'date', header: 'Date', width: '120px', render: (v) => formatDate(v), sortable: true },
  { key: 'status', header: 'Status', width: '100px', render: (v) => (
    <Badge variant={statusColors[v]} size="sm">{v.charAt(0).toUpperCase() + v.slice(1)}</Badge>
  )},
  { key: 'time', header: 'Time', width: '100px' },
  { key: 'notes', header: 'Notes', render: (v) => v || <span className="text-text-tertiary">-</span> },
];

const Attendance = () => {
  const { success, error } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: attendanceRecords, loading: _loading, error: apiError, reload } = useApiData('/attendance');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({ studentId: '', course: '', date: new Date().toISOString().split('T')[0], status: 'present', time: '10:00', notes: '' });
  const [students, setStudents] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await api.get('/students');
        setStudents(Array.isArray(res.data) ? res.data : []);
      } catch {
        setStudents([]);
      }
    };
    loadStudents();
  }, []);

  const studentOptions = useMemo(() => students.map(s => ({ value: String(s.id), label: `${s.name} (${s.id}) - ${s.section || ''}` })), [students]);
  const courseOptions = useMemo(() => {
    const courses = ['CS101', 'MATH201', 'PHYS101', 'ENG110', 'OOP', 'CPROG', 'MICRO', 'DBMS', 'OS', 'CN', 'MATH101', 'MATH102', 'STAT', 'FM', 'BM', 'ECO', 'CHEM101', 'BIO101', 'IT', 'WEB'];
    if (formData.course && !courses.includes(formData.course)) courses.unshift(formData.course);
    return courses.map(course => ({ value: course, label: course }));
  }, [formData.course]);
  const statusOptions = ['present', 'absent', 'late', 'excused'].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));

  const stats = useMemo(() => {
    const present = attendanceRecords.filter(a => a.status === 'present').length;
    const absent = attendanceRecords.filter(a => a.status === 'absent').length;
    const late = attendanceRecords.filter(a => a.status === 'late').length;
    const excused = attendanceRecords.filter(a => a.status === 'excused').length;
    const total = attendanceRecords.length;
    const rate = total > 0 ? Math.round((attendanceRecords.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'excused').length / total) * 100) : 0;
    return { present, absent, late, excused, total, rate };
  }, [attendanceRecords]);

  const filteredAttendance = useMemo(() => {
    return attendanceRecords.filter(a => {
      const matchesSearch = !searchTerm || a.student.toLowerCase().includes(searchTerm.toLowerCase()) || a.course.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClassroom = !selectedClassroom || a.classroom === selectedClassroom;
      return matchesSearch && matchesClassroom;
    });
  }, [attendanceRecords, searchTerm, selectedClassroom]);

  const handleOpenModal = (record = null) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        studentId: record.studentId || '',
        course: record.course || '',
        date: record.date || new Date().toISOString().split('T')[0],
        status: record.status || 'present',
        time: record.time || '10:00',
        notes: record.notes || '',
      });
    } else {
      setEditingRecord(null);
      setFormData({ studentId: '', course: '', date: new Date().toISOString().split('T')[0], status: 'present', time: '10:00', notes: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const payload = {
      studentId: formData.studentId,
      course: formData.course,
      date: formData.date,
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
      error(err.response?.data?.message || err.message || 'Failed to save attendance');
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
      error(err.response?.data?.message || err.message || 'Failed to delete record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Page Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-header-title">Attendance</h1>
            <p className="page-header-subtitle">Track and manage student attendance</p>
          </div>
          {isAdmin && (
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Mark Attendance
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{stats.present}</p>
            <p className="text-[11px] text-text-tertiary">Present</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{stats.absent}</p>
            <p className="text-[11px] text-text-tertiary">Absent</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{stats.late}</p>
            <p className="text-[11px] text-text-tertiary">Late</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{stats.excused}</p>
            <p className="text-[11px] text-text-tertiary">Excused</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{stats.rate}%</p>
            <p className="text-[11px] text-text-tertiary">Rate</p>
          </div>
        </div>
      </div>

      {/* Classroom Filter */}
      <div className="p-5 rounded-2xl bg-[#151C2C] border border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Classrooms</h3>
            <p className="text-[11px] text-text-tertiary">Filter by classroom</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(() => {
            const rooms = Array.from(new Set(students.filter(s => s.section).map(s => s.section)));
            if (rooms.length === 0) return <span className="text-sm text-text-secondary">No classroom data available</span>;
            return rooms.map(room => (
              <button
                key={room}
                onClick={() => setSelectedClassroom(selectedClassroom === room ? '' : room)}
                className={cn(
                  'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200',
selectedClassroom === room
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-white/[0.03] text-text-secondary border-white/[0.06] hover:bg-white/[0.06] hover:text-text-primary'
                )}
              >
                {room}
              </button>
            ));
          })()}
          {selectedClassroom && (
            <button
              onClick={() => setSelectedClassroom('')}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all duration-200"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl bg-[#151C2C] border border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search students or courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20 transition-all duration-200"
            />
          </div>
        </div>
        <div className="p-5 pt-0">
          {apiError && (
            <div className="mt-4 p-3 rounded-xl border border-border bg-background/50 text-sm text-text-secondary">
              {apiError}
            </div>
          )}
          <Table
            columns={columns}
            data={filteredAttendance}
            keyField="id"
            searchable={false}
            filterable={false}
            paginated
            pageSize={10}
            rowActions={isAdmin ? [
              { label: 'Edit', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>, onClick: (r) => handleOpenModal(r), variant: 'ghost' },
              { label: 'Delete', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>, onClick: (r) => setDeleteConfirm(r), variant: 'danger' },
            ] : []}
            emptyMessage="No attendance records found"
          />
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingRecord(null); }} title={editingRecord ? 'Edit Attendance Record' : 'Mark Attendance'} size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setShowModal(false); setEditingRecord(null); }}>Cancel</Button>
            {isAdmin && <Button onClick={handleSubmit}>{editingRecord ? 'Update' : 'Save'}</Button>}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Student"
              value={formData.studentId}
              onChange={(val) => setFormData({ ...formData, studentId: val })}
              options={studentOptions}
              placeholder="Select Student"
            />
            <Select
              label="Course"
              value={formData.course}
              onChange={(val) => setFormData({ ...formData, course: val })}
              options={courseOptions}
              placeholder="Select Course"
            />
            <Input label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            <Select
              label="Status"
              value={formData.status}
              onChange={(val) => setFormData({ ...formData, status: val })}
              options={statusOptions}
              placeholder="Select Status"
            />
          </div>
          <Input label="Time" type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
          <Input label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes..." />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Attendance Record"
        message={`Are you sure you want to delete the attendance record for ${deleteConfirm?.student} on ${formatDate(deleteConfirm?.date)}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default Attendance;
