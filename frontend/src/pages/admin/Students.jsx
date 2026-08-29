import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  program: '',
  classroom: '',
  year: 1,
  status: 'active',
  password: '',
};

const AdminStudents = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { success, error: showError } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  const openEditModal = (student) => {
    setEditing(student);
    setForm({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      program: student.program || '',
      classroom: student.classroom || student.section || '',
      year: student.year || 1,
      status: student.status || 'active',
      password: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete student "${student.name}"?`)) return;
    try {
      await api.delete(`/students/${student.id}`);
      success('Student deleted successfully');
      await loadStudents();
    } catch (err) {
      const msg = err?.response?.data?.message;
      showError(msg || 'Failed to delete student.');
    }
  };
  const [classrooms, setClassrooms] = useState([]);
  const [classFilter, setClassFilter] = useState('');

  const toggleReveal = (id) =>
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  const revealAll = () => {
    const next = {};
    if (students.some((s) => !revealed[s.id])) students.forEach((s) => (next[s.id] = true));
    setRevealed(next);
  };

  const loadStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data || []);
    } catch (err) {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClassrooms = async () => {
    try {
      const res = await api.get('/classrooms');
      setClassrooms(Array.isArray(res.data) ? res.data : []);
    } catch {
      setClassrooms([]);
    }
  };

  useEffect(() => {
    loadStudents();
    loadClassrooms();
  }, []);

  const openModal = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.program.trim()) {
      showError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        program: form.program,
        classroom: form.classroom,
        year: Number(form.year),
        status: form.status,
      };
      if (form.password) payload.password = form.password;
      if (editing) {
        await api.put(`/students/${editing.id}`, payload);
        success('Student updated successfully');
      } else {
        await api.post('/students', payload);
        success('Student added successfully');
      }
      setShowModal(false);
      setEditing(null);
      await loadStudents();
    } catch (err) {
      const msg = err?.response?.data?.message;
      showError(msg || 'Failed to save student.');
    } finally {
      setSaving(false);
    }
  };

  const modalClassroomOptions = classrooms.map((c) => ({
    value: c.roomNumber || c.sectionName || '',
    label: c.roomNumber ? `${c.roomNumber}${c.sectionName ? ` - ${c.sectionName}` : ''}` : (c.sectionName || ''),
  }));

  const tableClassroomOptions = React.useMemo(() => {
    const unique = new Set();
    students.forEach((s) => {
      const val = s.classroom || s.section || '';
      if (val) unique.add(val);
    });
    return Array.from(unique).map((val) => ({ value: val, label: val }));
  }, [students]);

  const filteredStudents = React.useMemo(() => {
    if (!classFilter) return students;
    return students.filter((s) => (s.classroom || s.section || '') === classFilter);
  }, [students, classFilter]);

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Students</h2>
        <div>
          <button className="btn btn-primary me-2" onClick={openModal}>Add Student</button>
          {isAdmin && (
            <button className="btn btn-outline-secondary" onClick={revealAll}>
              {students.some((s) => !revealed[s.id]) ? 'Show All Passwords' : 'Hide All Passwords'}
            </button>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">Student List</h5>
            <Select
              value={classFilter}
              onChange={setClassFilter}
              options={[{ value: '', label: 'All Classrooms' }, ...tableClassroomOptions]}
              placeholder="Filter by classroom"
              className="w-auto min-w-[180px]"
            />
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                 <tr>
                   <th>ID</th>
                   <th>Name</th>
                   <th>Email</th>
                   <th>Phone</th>
                   <th>Program</th>
                   <th>Class Room No</th>
                   <th>Status</th>
                   {isAdmin && <th>Password</th>}
                   <th>Actions</th>
                 </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                     <td colSpan={isAdmin ? 9 : 8} className="text-center text-muted">
                    {loading ? 'Loading...' : 'No students found.'}
                  </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.name}</td>
                       <td>{s.email}</td>
                       <td>{s.phone || '-'}</td>
                       <td>{s.program}</td>
                       <td>{s.classroom || s.section || '-'}</td>
                      <td><span className={`badge bg-${s.status === 'active' ? 'success' : s.status === 'graduated' ? 'info' : s.status === 'pending' ? 'warning' : 'secondary'}`}>{s.status}</span></td>
                      {isAdmin && (
                        <td>
                          <span className="me-1 font-monospace">{revealed[s.id] ? (s.password || '—') : '••••••'}</span>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => toggleReveal(s.id)}
                            disabled={!s.password}
                          >
                            {revealed[s.id] ? 'Hide' : 'Show'}
                          </button>
                        </td>
                      )}
                       <td>
                         <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditModal(s)}>Edit</button>
                         <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s)}>Delete</button>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={editing ? 'Edit Student' : 'Add Student'} size="lg"
        footer={<><Button variant="ghost" onClick={closeModal} disabled={saving}>Cancel</Button><Button onClick={handleSubmit} loading={saving}>Save Student</Button></>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 555-1234" />
          <Input label="Program" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} placeholder="e.g. Computer Science" required />
          <Select
            label="Classroom"
            value={form.classroom}
            onChange={(value) => setForm({ ...form, classroom: value })}
            options={modalClassroomOptions}
            placeholder="Select classroom"
          />
          <Input label="Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 1 })} min={1} max={5} />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="select-themed"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="graduated">Graduated</option>
          </select>
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set initial password" />
        </form>
      </Modal>
    </div>
  );
};

export default AdminStudents;
