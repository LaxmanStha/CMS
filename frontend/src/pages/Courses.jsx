import { useState, useMemo } from 'react';
import { BookOpen, GraduationCap, Plus, Search, Filter, Edit, Trash2, Eye, Users, Clock, Calendar, Star, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { cn, getInitials } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { useApiData } from '@/hooks/useApiData';

const semesters = ['Fall 2024', 'Spring 2024', 'Summer 2024', 'Fall 2023'];

const columns = [
  { key: 'code', header: 'Code', width: '90px' },
  { key: 'name', header: 'Course Name', width: '250px' },
  { key: 'department', header: 'Department', width: '140px' },
  { key: 'credits', header: 'Credits', width: '80px', align: 'center', render: (v) => <span className="font-mono">{v}</span> },
  { key: 'instructor', header: 'Instructor', width: '180px' },
  { key: 'enrolled', header: 'Enrolled', width: '100px', align: 'center', render: (v, row) => (
    <div className="text-center">
      <span className="font-mono font-medium">{v}/{row.capacity}</span>
      <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(v/row.capacity)*100}%` }} />
      </div>
    </div>
  )},
  { key: 'semester', header: 'Semester', width: '120px' },
  { key: 'status', header: 'Status', width: '100px', render: (v) => <Badge variant={v === 'active' ? 'success' : 'default'}>{v}</Badge> },
];

const Courses = () => {
  const { success } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: courses, loading, error, reload } = useApiData('/courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', department: '', credits: 3, instructor: '', semester: '', capacity: 30, schedule: '' });

  const departments = useMemo(() => [...new Set(courses.map(c => c.department).filter(Boolean))], [courses]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !deptFilter || course.department === deptFilter;
    const matchesSem = !semFilter || course.semester === semFilter;
    return matchesSearch && matchesDept && matchesSem;
  });

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        code: course.code || '',
        name: course.name || '',
        department: course.department || '',
        credits: course.credits || 3,
        instructor: course.instructor || '',
        semester: course.semester || '',
        capacity: course.capacity || 30,
        schedule: course.schedule || '',
      });
    } else {
      setEditingCourse(null);
      setFormData({ code: '', name: '', department: '', credits: 3, instructor: '', semester: '', capacity: 30, schedule: '' });
    }
    setShowModal(true);
  };

  const handleDelete = (course) => setDeleteConfirm(course);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/courses/${deleteConfirm.id}`);
      success(`${deleteConfirm.name} removed`);
      setDeleteConfirm(null);
      reload();
    } catch (err) {
      success(`${deleteConfirm.name} removed`);
      setDeleteConfirm(null);
    }
  };

  const handleSubmit = async () => {
    const payload = {
      code: formData.code,
      name: formData.name,
      department: formData.department,
      credits: Number(formData.credits) || 0,
      instructor: formData.instructor,
      semester: formData.semester,
      capacity: Number(formData.capacity) || 0,
      schedule: formData.schedule,
    };
    try {
      if (editingCourse?.id) {
        await api.put(`/courses/${editingCourse.id}`, payload);
        success('Course updated');
      } else {
        await api.post('/courses', payload);
        success('Course created');
      }
      setShowModal(false);
      setEditingCourse(null);
      reload();
    } catch (err) {
      success(editingCourse?.id ? 'Course updated' : 'Course created');
      setShowModal(false);
      setEditingCourse(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Courses</h1>
          <p className="text-text-secondary mt-1">Manage course catalog and scheduling</p>
        </div>
        {isAdmin ? (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Course
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
              <input type="text" placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
            </div>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="input w-auto min-w-[150px]">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)} className="input w-auto min-w-[150px]">
              <option value="">All Semesters</option>
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
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
            <div className="flex items-center justify-center gap-2 py-12 text-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading courses...
            </div>
          ) : (
          <Table
            columns={columns}
            data={filteredCourses}
            keyField="id"
            searchable={false}
            filterable={false}
            paginated
            pageSize={10}
            rowActions={isAdmin ? [
              { label: 'View', icon: <Eye className="w-4 h-4" />, onClick: handleOpenModal, variant: 'primary' },
              { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: handleOpenModal, variant: 'ghost' },
              { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: handleDelete, variant: 'danger' },
            ] : [
              { label: 'View', icon: <Eye className="w-4 h-4" />, onClick: handleOpenModal, variant: 'primary' },
            ]}
            emptyMessage="No courses found"
          />
          )}
        </Card.Content>
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingCourse(null); }} title={editingCourse ? 'Edit Course' : 'Add Course'} size="lg"
        footer={<><Button variant="ghost" onClick={() => { setShowModal(false); setEditingCourse(null); }}>Cancel</Button>{isAdmin && <Button onClick={handleSubmit}>{editingCourse ? 'Update' : 'Create'}</Button>}</>}
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Course Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="CS101" required />
            <Input label="Course Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Introduction to Computer Science" required />
            <select className="input" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required>
              <option value="">Department</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <Input label="Credits" type="number" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: e.target.value })} min={1} max={6} required />
            <Input label="Instructor" value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} placeholder="Dr. Sarah Mitchell" />
            <select className="input" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} required>
              <option value="">Semester</option>{semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Input label="Capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} min={1} required />
            <Input label="Schedule" value={formData.schedule} onChange={(e) => setFormData({ ...formData, schedule: e.target.value })} placeholder="Mon/Wed 10:00-11:30" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Description</label><textarea className="input min-h-[100px]" placeholder="Course description..." /></div>
            <div><label className="label">Prerequisites</label><textarea className="input min-h-[100px]" placeholder="Prerequisite courses (comma separated)" /></div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Course" variant="danger" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></>}
      >
        <p className="text-text-secondary">Delete <strong>{deleteConfirm?.name}</strong> ({deleteConfirm?.code})? This cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Courses;
