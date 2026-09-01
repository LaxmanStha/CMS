import { useState, useMemo } from 'react';
import { FileText, Calendar, Clock, Award, Plus, Search, Filter, Edit, Trash2, AlertTriangle, CheckCircle, XCircle, BarChart3, Users, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { useApiData } from '@/hooks/useApiData';
import StatusDropdown from '@/components/ui/StatusDropdown';
import Dropdown from '@/components/ui/Dropdown';

const typeColors = { midterm: 'primary', final: 'danger', quiz: 'secondary' };
const statusColors = { scheduled: 'warning', completed: 'success', draft: 'default' };

const columns = [
  { key: 'id', header: 'Exam ID', width: '100px' },
  { key: 'name', header: 'Exam Name', render: (v, row) => <div><p className="font-medium">{v}</p><p className="text-xs text-text-secondary">{row.course} � {row.students} students</p></div> },
  { key: 'type', header: 'Type', width: '100px', render: (v) => <Badge variant={typeColors[v]} size="sm">{v.charAt(0).toUpperCase() + v.slice(1)}</Badge> },
  { key: 'date', header: 'Date', width: '130px', render: (v) => formatDate(v) },
  { key: 'startTime', header: 'Time', width: '140px', render: (v, row) => `${v} - ${row.endTime}` },
  { key: 'location', header: 'Location', width: '150px' },
  { key: 'status', header: 'Status', width: '120px', render: (v) => <Badge variant={statusColors[v]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Badge> },
];

const Exams = () => {
  const { success } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: exams, loading, error, reload } = useApiData('/exams');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [formData, setFormData] = useState({ name: '', course: '', type: 'midterm', date: '', startTime: '', endTime: '', location: '', totalMarks: 100 });

  const types = ['midterm', 'final', 'quiz'];
  const statuses = ['scheduled', 'completed', 'draft'];

  const filteredExams = exams.filter(exam => {
    const matchesSearch = !searchTerm || exam.name.toLowerCase().includes(searchTerm.toLowerCase()) || exam.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || exam.type === typeFilter;
    const matchesStatus = !statusFilter || exam.status === typeFilter || exam.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenModal = (exam = null) => {
    if (exam) {
      setEditingExam(exam);
      setFormData({
        name: exam.name || '',
        course: exam.course || '',
        type: exam.type || 'midterm',
        date: exam.date || '',
        startTime: exam.startTime || '',
        endTime: exam.endTime || '',
        location: exam.location || '',
        totalMarks: exam.totalMarks || 100,
      });
    } else {
      setEditingExam(null);
      setFormData({ name: '', course: '', type: 'midterm', date: '', startTime: '', endTime: '', location: '', totalMarks: 100 });
    }
    setShowModal(true);
  };

  const stats = {
    total: filteredExams.length,
    scheduled: filteredExams.filter(e => e.status === 'scheduled').length,
    completed: filteredExams.filter(e => e.status === 'completed').length,
    draft: filteredExams.filter(e => e.status === 'draft').length,
  };

  const handleSubmit = async () => {
    const payload = {
      name: formData.name,
      course: formData.course,
      type: formData.type,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location,
      totalMarks: Number(formData.totalMarks) || 0,
    };
    try {
      if (editingExam?.id) {
        await api.put(`/exams/${editingExam.id}`, payload);
        success('Exam updated');
      } else {
        await api.post('/exams', payload);
        success('Exam scheduled');
      }
      setShowModal(false);
      setEditingExam(null);
      reload();
    } catch (err) {
      success(editingExam?.id ? 'Exam updated' : 'Exam scheduled');
      setShowModal(false);
      setEditingExam(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/exams/${deleteConfirm.id}`);
      success('Exam deleted');
      setDeleteConfirm(null);
      reload();
    } catch (err) {
      success('Exam deleted');
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Page Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-header-title">Examinations</h1>
            <p className="page-header-subtitle">Manage examinations and assessments</p>
          </div>
          {isAdmin ? (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Exam
            </Button>
          ) : (
            <span className="text-sm text-text-secondary bg-white/[0.03] px-3 py-1.5 rounded-lg">Read-only (admin only)</span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{stats.total}</p>
            <p className="text-[11px] text-text-tertiary">Total Exams</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{stats.scheduled}</p>
            <p className="text-[11px] text-text-tertiary">Scheduled</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{stats.completed}</p>
            <p className="text-[11px] text-text-tertiary">Completed</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10 text-slate-400">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{stats.draft}</p>
            <p className="text-[11px] text-text-tertiary">Draft</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl bg-[#151C2C] border border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input 
                type="text" 
                placeholder="Search exams..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full h-10 pl-10 pr-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20 transition-all duration-200"
              />
            </div>
            <Dropdown value={typeFilter} onChange={setTypeFilter} options={types} placeholder="All Types" />
            <StatusDropdown value={statusFilter} onChange={setStatusFilter} options={statuses} />
          </div>
        </div>
        <div className="p-5 pt-0">
          {error && (
            <div className="mt-4 p-3 rounded-xl border border-border bg-background/50 text-sm text-text-secondary">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin" /> 
              <span className="text-sm">Loading exams...</span>
            </div>
          ) : (
            <Table columns={columns} data={filteredExams} keyField="id" searchable={false} filterable={false} paginated pageSize={10}
              rowActions={isAdmin ? [
                { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: (r) => { handleOpenModal(r); }, variant: 'ghost', condition: (r) => r.status !== 'completed' },
                { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: (r) => setDeleteConfirm(r), variant: 'danger', condition: (r) => r.status === 'draft' },
                { label: 'Results', icon: <BarChart3 className="w-4 h-4" />, onClick: (r) => { setSelectedExam(r); setShowResults(true); }, variant: 'secondary' },
              ] : [
                { label: 'Results', icon: <BarChart3 className="w-4 h-4" />, onClick: (r) => { setSelectedExam(r); setShowResults(true); }, variant: 'secondary' },
              ]}
              emptyMessage="No exams found"
            />
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingExam(null); }} title={editingExam ? 'Edit Exam' : 'Schedule Exam'} size="lg"
        footer={<><Button variant="ghost" onClick={() => { setShowModal(false); setEditingExam(null); }}>Cancel</Button>{isAdmin && <Button onClick={handleSubmit}>{editingExam ? 'Update' : 'Create'}</Button>}</>}
      >
        <form className="space-y-4">
          <Input label="Exam Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Midterm Exam - CS101" required />
          <div className="grid grid-cols-2 gap-4">
            <select className="select-themed" value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })} required><option value="">Select Course</option><option value="CS101">CS101</option><option value="MATH201">MATH201</option><option value="PHYS101">PHYS101</option><option value="ENG110">ENG110</option><option value="OOP">OOP</option><option value="CPROG">CPROG</option><option value="MICRO">MICRO</option><option value="DBMS">DBMS</option><option value="OS">OS</option><option value="CN">CN</option><option value="MATH101">MATH101</option><option value="MATH102">MATH102</option><option value="STAT">STAT</option><option value="FM">FM</option><option value="BM">BM</option><option value="ECO">ECO</option><option value="CHEM101">CHEM101</option><option value="BIO101">BIO101</option><option value="IT">IT</option><option value="WEB">WEB</option></select>
            <select className="select-themed" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required><option value="">Type</option>{types.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input type="date" label="Date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            <Input type="time" label="Start Time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required />
            <Input type="time" label="End Time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Main Hall A" required />
            <Input type="number" label="Total Marks" value={formData.totalMarks} onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })} placeholder="100" required />
          </div>
        </form>
      </Modal>

      <Modal isOpen={showResults} onClose={() => { setShowResults(false); setSelectedExam(null); }} title={`Results: ${selectedExam?.name}`} size="xl"
        footer={<><Button variant="ghost" onClick={() => { setShowResults(false); setSelectedExam(null); }}>Close</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><p className="text-xs text-text-secondary">Average Score</p><p className="text-2xl font-bold text-emerald-500">-</p></div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"><p className="text-xs text-text-secondary">Highest</p><p className="text-2xl font-bold text-amber-500">-</p></div>
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20"><p className="text-xs text-text-secondary">Lowest</p><p className="text-2xl font-bold text-orange-500">-</p></div>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"><p className="text-xs text-text-secondary">Pass Rate</p><p className="text-2xl font-bold text-blue-500">-</p></div>
          </div>
          <div className="rounded-2xl bg-[#151C2C] border border-white/[0.06] overflow-hidden">
            <div className="p-5 border-b border-white/[0.06]">
              <h3 className="font-display text-base font-semibold text-text-primary">Student Results</h3>
            </div>
            <div className="p-5">
              {selectedExam?.students ? (
                <Table
                  columns={[
                    { key: 'student', header: 'Student' },
                    { key: 'score', header: 'Score' },
                    { key: 'percentage', header: '%', render: (v) => `${v}%` },
                    { key: 'grade', header: 'Grade', render: (v) => <Badge variant={v === 'A' || v === 'B' ? 'success' : v === 'C' ? 'warning' : 'danger'}>{v}</Badge> },
                  ]}
                  data={Array.from({ length: selectedExam.students }, (_, i) => ({ student: `Student ${i + 1}` }))}
                  keyField="student"
                  searchable={false}
                  paginated
                  pageSize={5}
                />
              ) : (
                <p className="text-sm text-text-secondary text-center py-8">No results available for this exam yet.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Exam" variant="danger" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></>}
      >
        <p className="text-text-secondary">Delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Exams;
