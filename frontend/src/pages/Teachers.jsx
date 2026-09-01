import { useState, useEffect, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";

const STATUSES = ["active", "on_leave", "inactive"];

const statusLabel = (s) => s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

const Teachers = () => {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", department: "", assignedCourse: "", assignedClassroom: "", status: "active", hireDate: "", password: "" });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/teachers");
      setTeachers(Array.isArray(res.data) ? res.data.map(t => ({
        ...t,
        department: typeof t.department === 'string' ? t.department : t.department?.name || '',
        assignedCourse: typeof t.assignedCourse === 'string' ? t.assignedCourse : t.assignedCourse?.name || '',
      })) : []);
    } catch (err) {
      showError("Failed to load teachers");
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadLookups = async () => {
      try {
        const [deptRes, courseRes] = await Promise.all([
          api.get("/departments"),
          api.get("/courses"),
        ]);
        if (!cancelled) {
          setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
          setCourses(Array.isArray(courseRes.data) ? courseRes.data : []);
        }
      } catch {
        if (!cancelled) {
          setDepartments([]);
          setCourses([]);
        }
      }
    };
    loadLookups();
    return () => { cancelled = true; };
  }, []);

  const departmentOptions = useMemo(() => {
    if (!Array.isArray(departments)) return [];
    return departments.map((d) => {
      const label = typeof d === 'string' ? d : (d.name || d);
      const value = typeof d === 'string' ? d : (d.name || d);
      return { value, label };
    });
  }, [departments]);

  const courseOptions = useMemo(() => {
    if (!Array.isArray(courses)) return [];
    return courses.map((c) => {
      const label = typeof c === 'string' ? c : (c.name || c.code || c);
      const value = typeof c === 'string' ? c : (c.name || c.code || c);
      return { value, label };
    });
  }, [courses]);

  const filteredTeachers = useMemo(() => teachers.filter((t) => {
    const matchesSearch = !searchTerm ||
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(t.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !deptFilter || t.department === deptFilter;
    const matchesCourse = !courseFilter || t.assignedCourse === courseFilter;
    const matchesStatus = !statusFilter || (t.status || "active") === statusFilter;
    return matchesSearch && matchesDept && matchesCourse && matchesStatus;
  }), [teachers, searchTerm, deptFilter, courseFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: teachers.length,
    active: teachers.filter(t => (t.status || 'active') === 'active').length,
    onLeave: teachers.filter(t => t.status === 'on_leave').length,
  }), [teachers]);

  const handleOpenModal = (t = null) => {
    if (t) {
      setEditingTeacher(t);
      setFormData({
        name: t.name || "",
        email: t.email || "",
        phone: t.phone || "",
        department: t.department || "",
        assignedCourse: t.assignedCourse || "",
        assignedClassroom: t.assignedClassroom || "",
        status: t.status || "active",
        hireDate: t.hireDate || "",
        password: "",
      });
    } else {
      setEditingTeacher(null);
      setFormData({ name: "", email: "", phone: "", department: "", assignedCourse: "", assignedClassroom: "", status: "active", hireDate: "", password: "" });
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
        assignedCourse: formData.assignedCourse,
        assignedClassroom: formData.assignedClassroom,
        status: formData.status,
        hireDate: formData.hireDate,
      };
      if (editingTeacher) {
        await api.put(`/teachers/${editingTeacher.id}`, payload);
        success("Teacher updated successfully");
      } else {
        payload.password = formData.password;
        await api.post("/teachers", payload);
        success("Teacher added successfully");
      }
      setShowModal(false);
      await fetchTeachers();
    } catch (err) {
      showError(err.response?.data?.message || err.response?.data || "Failed to save teacher");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (t) => setDeleteConfirm(t);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/teachers/${deleteConfirm.id}`);
      success(`${deleteConfirm.name} has been removed`);
      setDeleteConfirm(null);
      await fetchTeachers();
    } catch (err) {
      showError("Failed to delete teacher");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Teachers</h1>
          <p className="text-text-secondary mt-1">Manage teachers and their assignments</p>
        </div>
        {isAdmin ? (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Teacher
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
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="input w-auto min-w-[150px]">
              <option value="">All Departments</option>
              {departments.map(d => <option key={String(d)} value={d}>{d}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto min-w-[150px]">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Course</th>
                  <th>Classroom</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Hired</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 10 : 9} className="text-center text-muted">
                      {loading ? 'Loading...' : 'No teachers found.'}
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((t) => (
                    <tr key={t.id}>
                      <td>TCH{String(t.id).padStart(3, "0")}</td>
                      <td>{t.name || '-'}</td>
                      <td>{t.email || '-'}</td>
                      <td>{t.department || '-'}</td>
                      <td>{t.assignedCourse || '-'}</td>
                      <td>{t.assignedClassroom || '-'}</td>
                      <td>{t.phone || '-'}</td>
                      <td>
                        <Badge variant={t.status === "active" ? "success" : t.status === "on_leave" ? "warning" : "default"}>
                          {statusLabel(t.status || "active")}
                        </Badge>
                      </td>
                      <td>{formatDate(t.hireDate)}</td>
                      {isAdmin && (
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleOpenModal(t)}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(t)}>Delete</button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'} size="lg"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>{isAdmin && <Button onClick={handleSubmit} loading={saving}>{editingTeacher ? 'Update' : 'Create'}</Button>}</>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Dr. John Smith" required />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="prof@college.edu" required />
            <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Set initial password" />
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1-555-0000" />
            <select className="select-themed" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required>
              <option value="">Select Department</option>
              {departments.map(d => <option key={String(d)} value={d}>{d}</option>)}
            </select>
            <select className="select-themed" value={formData.assignedCourse} onChange={(e) => setFormData({...formData, assignedCourse: e.target.value})}>
              <option value="">Select Course</option>
              {courses.map(c => <option key={String(c)} value={c}>{c}</option>)}
            </select>
            <Input label="Assigned Classroom" value={formData.assignedClassroom} onChange={(e) => setFormData({...formData, assignedClassroom: e.target.value})} placeholder="e.g. A101" />
            <select className="select-themed" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
              {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
            <Input label="Hire Date" type="date" value={formData.hireDate} onChange={(e) => setFormData({...formData, hireDate: e.target.value})} />
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Teacher" variant="danger" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></>}
      >
        <p className="text-text-secondary">Delete <strong>{deleteConfirm?.name}</strong> (TCH{String(deleteConfirm?.id).padStart(3, '0')})? This cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Teachers;





