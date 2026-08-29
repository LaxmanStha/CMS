import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import StatCard from '@/components/ui/StatCard';
import { useToast } from '@/context/ToastContext';
import api from '@/services/api';

const AdminDepartments = () => {
  const { success, error: showError } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: '',
    department: '',
    semester: '',
    status: 'active',
  });
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/courses');
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const openModal = () => {
    setFormData({
      name: '',
      code: '',
      credits: '',
      department: '',
      semester: '',
      status: 'active',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = 'Course name is required';
    }
    if (!formData.code.trim()) {
      nextErrors.code = 'Course code is required';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      await api.post('/api/courses', {
        name: formData.name.trim(),
        code: formData.code.trim(),
        credits: Number(formData.credits) || 0,
        department: formData.department,
        semester: formData.semester,
        status: formData.status || 'active',
      });
      success('Course added successfully');
      setShowModal(false);
      await fetchCourses();
    } catch (err) {
      if (err.response?.status === 409) {
        setErrors({ code: 'A course with this code already exists' });
      } else {
        showError(err.response?.data?.message || 'Failed to add course');
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/api/courses/${deleteTarget.id}`);
      success(`${deleteTarget.name} has been removed`);
      setDeleteTarget(null);
      await fetchCourses();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'department', header: 'Department' },
    { key: 'credits', header: 'Credits' },
    { key: 'semester', header: 'Semester' },
    { key: 'status', header: 'Status' },
  ];

  const rowActions = [
    {
      label: 'Delete',
      variant: 'danger',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (row) => setDeleteTarget(row),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Courses</h1>
          <p className="text-text-secondary mt-1">Manage the courses offered by the institution</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          iconPosition="left"
          onClick={openModal}
        >
          Add Course
        </Button>
      </div>

      <StatCard
        title="Total Courses"
        value={courses.length}
        icon={BookOpen}
        loading={loading}
      />

      <Card>
        <Card.Content>
          <Table
            columns={columns}
            data={courses}
            keyField="id"
            loading={loading}
            emptyMessage="No courses found"
            searchable
            searchColumns={['name', 'code']}
            rowActions={rowActions}
          />
        </Card.Content>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Course"
        description="Create a new course for the institution"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              Create
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Introduction to Programming"
            error={errors.name}
            autoFocus
          />
          <Input
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g. CS101"
            error={errors.code}
          />
          <Input
            label="Credits"
            type="number"
            value={formData.credits}
            onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
            placeholder="e.g. 3"
          />
          <Input
            label="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="e.g. Computer Science"
          />
          <Input
            label="Semester"
            value={formData.semester}
            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            placeholder="e.g. Fall"
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Course"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
};

export default AdminDepartments;
