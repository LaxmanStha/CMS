import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Users, UserPlus, UserMinus, UserCheck, UserCog, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { formatDate, getInitials } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";

const STATUSES = ["active", "inactive", "maintenance"];

const statusLabel = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const AdminClassrooms = () => {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ room_number: "", section_name: "", capacity: "", teacher_id: "", status: "active" });
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollClassroomId, setEnrollClassroomId] = useState(null);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/classrooms");
      setClassrooms(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showError("Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/faculty");
      setTeachers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showError("Failed to load teachers");
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/students");
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showError("Failed to load students");
    }
  };

  const fetchClassroomStudents = async (classroomId) => {
    try {
      const res = await api.get(`/classrooms/${classroomId}/students`);
      setEnrolledStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showError("Failed to load enrolled students");
    }
  };

  const fetchAvailableStudents = async (classroomId) => {
    try {
      const res = await api.get(`/classrooms/${classroomId}/available-students`);
      setAvailableStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showError("Failed to load available students");
    }
  };

  useEffect(() => {
    fetchClassrooms();
    fetchTeachers();
    fetchStudents();
  }, []);

  const openEnrollModal = (classroomId) => {
    setEnrollClassroomId(classroomId);
    setSelectedStudents([]);
    fetchClassroomStudents(classroomId);
    fetchAvailableStudents(classroomId);
    setShowEnrollModal(true);
  };

  const handleOpenModal = (c = null) => {
    if (c) {
      setEditingClassroom(c);
      setFormData({
        room_number: c.room_number || "",
        section_name: c.section_name || "",
        capacity: c.capacity || "",
        teacher_id: c.teacher_id || "",
        status: c.status || "active",
      });
    } else {
      setEditingClassroom(null);
      setFormData({ room_number: "", section_name: "", capacity: "", teacher_id: "", status: "active" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClassroom(null);
    setFormData({ room_number: "", section_name: "", capacity: "", teacher_id: "", status: "active" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        room_number: formData.room_number,
        section_name: formData.section_name,
        capacity: parseInt(formData.capacity) || 0,
        teacher_id: formData.teacher_id || null,
        status: formData.status,
      };
      if (editingClassroom) {
        await api.put(`/classrooms/${editingClassroom.id}`, payload);
        success("Classroom updated successfully");
      } else {
        const res = await api.post("/classrooms", payload);
        success("Classroom created successfully");
      }
      setShowModal(false);
      await fetchClassrooms();
    } catch (err) {
      showError(err.response?.data?.message || err.response?.data || "Failed to save classroom");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (c) => setDeleteConfirm(c);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/classrooms/${deleteConfirm.id}`);
      success(`${deleteConfirm.room_number} (${deleteConfirm.section_name}) has been deleted`);
      setDeleteConfirm(null);
      await fetchClassrooms();
    } catch (err) {
      showError(err.response?.data?.message || err.response?.data || "Failed to delete classroom");
    }
  };

  const handleEnrollStudents = async () => {
    if (selectedStudents.length === 0 || !enrollClassroomId) return;
    try {
      setSaving(true);
      for (const studentId of selectedStudents) {
        await api.post(`/classrooms/${enrollClassroomId}/students`, { student_id: studentId });
      }
      success(`${selectedStudents.length} student(s) enrolled`);
      setShowEnrollModal(false);
      setSelectedStudents([]);
      setEnrollClassroomId(null);
      await fetchClassrooms();
    } catch (err) {
      showError(err.response?.data?.message || err.response?.data || "Failed to enroll students");
    } finally {
      setSaving(false);
    }
  };

  const handleUnenrollStudent = async (classroomId, studentId) => {
    if (!window.confirm("Remove this student from the classroom?")) return;
    try {
      await api.delete(`/classrooms/${classroomId}/students/${studentId}`);
      success("Student removed from classroom");
      await fetchClassrooms();
    } catch (err) {
      showError(err.response?.data?.message || err.response?.data || "Failed to remove student");
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => prev.includes(studentId)
      ? prev.filter(id => id !== studentId)
      : [...prev, studentId]);
  };

  const stats = useMemo(() => ({
    total: classrooms.length,
    active: classrooms.filter(c => c.status === 'active').length,
    inactive: classrooms.filter(c => c.status === 'inactive').length,
    maintenance: classrooms.filter(c => c.status === 'maintenance').length,
  }), [classrooms]);

  const filteredClassrooms = useMemo(() => classrooms.filter((c) => {
    const matchesSearch = !searchTerm ||
      String(c.room_number).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(c.section_name).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [classrooms, searchTerm, statusFilter]);

  const columns = useMemo(() => [
    { key: "id", header: "ID", width: "60px", render: (val) => val != null ? val : "-" },
    { key: "room_number", header: "Room No.", width: "100px", render: (val) => val || "-" },
    { key: "section_name", header: "Section", width: "150px", render: (val) => val || "-" },
    { key: "capacity", header: "Capacity", width: "90px", render: (val) => val || "0" },
    { key: "teacher", header: "Assigned Teacher", width: "180px", render: (val, row) => val ? val.name : "<span class='text-xs text-text-tertiary'>Unassigned</span>" },
    { key: "status", header: "Status", width: "120px", render: (val) => (
      <Badge variant={val === "active" ? "success" : val === "inactive" ? "default" : "warning"}>
        {statusLabel(val)}
      </Badge>
    )},
  ], []);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-header-title">Classrooms</h1>
            <p className="page-header-subtitle">Manage classrooms, assignments, and enrollments</p>
          </div>
          {isAdmin ? (
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Classroom
            </Button>
          ) : (
            <span className="text-sm text-text-secondary bg-white/[0.03] px-3 py-1.5 rounded-lg">Read-only (admin only)</span>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            <p className="text-xs text-text-tertiary">Total Classrooms</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{stats.active}</p>
            <p className="text-xs text-text-tertiary">Active</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <UserCog className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{stats.inactive}</p>
            <p className="text-xs text-text-tertiary">Inactive</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <UserCog className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{stats.maintenance}</p>
            <p className="text-xs text-text-tertiary">Maintenance</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#151C2C] border border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search classrooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20 transition-all duration-200"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-text-primary focus:outline-none focus:border-amber-500/30 transition-all duration-200"
            >
              <option value="">All Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>
        </div>

        <div className="p-5 pt-0">
          <Table
            columns={columns}
            data={filteredClassrooms}
            keyField="id"
            searchable={false}
            filterable={false}
            paginated
            pageSize={10}
            loading={loading}
            rowActions={isAdmin ? [
              { label: "Edit", icon: <Edit className="w-4 h-4" />, onClick: handleOpenModal, variant: "ghost" },
              { label: "Enroll", icon: <UserPlus className="w-4 h-4" />, onClick: openEnrollModal, variant: "ghost" },
              { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: handleDelete, variant: "danger" },
            ] : []}
            emptyMessage={"No classrooms found"}
          />
        </div>
      </div>

      {/* Add/Edit Classroom Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingClassroom(null); setFormData({ room_number: "", section_name: "", capacity: "", teacher_id: "", status: "active" }); }} title={editingClassroom ? "Edit Classroom" : "Add Classroom"} size="lg"
        footer={<><Button variant="ghost" onClick={() => { setShowModal(false); setEditingClassroom(null); setFormData({ room_number: "", section_name: "", capacity: "", teacher_id: "", status: "active" }); }} disabled={saving}>Cancel</Button>{isAdmin && <Button onClick={handleSubmit} loading={saving}>{editingClassroom ? "Update" : "Create"}</Button>}</>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Room Number" value={formData.room_number} onChange={(e) => setFormData({...formData, room_number: e.target.value})} placeholder="e.g. 101" required />
            <Input label="Section Name" value={formData.section_name} onChange={(e) => setFormData({...formData, section_name: e.target.value})} placeholder="e.g. CS-A" required />
            <Input label="Capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} placeholder="e.g. 30" required />
            <Select
              label="Assigned Teacher"
              value={formData.teacher_id}
              onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
              options={teachers.map(t => ({ value: String(t.id), label: `${t.name} (${t.department || 'N/A'})` }))}
              placeholder="Select teacher (optional)"
            />
            <select className="select-themed" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} required>
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Classroom" variant="danger" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></>}
      >
        <p className="text-text-secondary">Delete <strong>{deleteConfirm?.room_number} ({deleteConfirm?.section_name})</strong>? This cannot be undone.</p>
      </Modal>

      {/* Enroll Students Modal */}
      <Modal isOpen={showEnrollModal} onClose={() => { setShowEnrollModal(false); setEnrollClassroomId(null); setSelectedStudents([]); }} title="Enroll Students" size="xl"
        footer={<><Button variant="ghost" onClick={() => { setShowEnrollModal(false); setEnrollClassroomId(null); setSelectedStudents([]); }} disabled={saving}>Cancel</Button>{isAdmin && <Button onClick={handleEnrollStudents} loading={saving}>Enroll {selectedStudents.length} Student(s)</Button>}</>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-text-primary mb-3">Currently Enrolled ({enrolledStudents.length})</h4>
              <div className="max-h-64 overflow-y-auto border border-white/[0.06] rounded-xl p-3 bg-white/[0.02]">
                {enrolledStudents.length === 0 ? (
                  <p className="text-text-tertiary text-sm text-center py-4">No students enrolled</p>
                ) : (
                  <ul className="space-y-2">
                    {enrolledStudents.map((s) => (
                      <li key={s.id} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <div className="avatar avatar-sm bg-primary/10 text-primary">{getInitials(s.name)}</div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{s.name}</p>
                            <p className="text-xs text-text-tertiary">{s.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnenrollStudent(enrollClassroomId, s.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                          title="Unenroll"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-text-primary mb-3">Available Students ({availableStudents.length})</h4>
              <div className="max-h-64 overflow-y-auto border border-white/[0.06] rounded-xl p-3 bg-white/[0.02]">
                {availableStudents.length === 0 ? (
                  <p className="text-text-tertiary text-sm text-center py-4">All students already enrolled</p>
                ) : (
                  <ul className="space-y-2">
                    {availableStudents.map((s) => (
                      <li key={s.id} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(s.id)}
                            onChange={() => setSelectedStudents(prev => prev.includes(s.id)
                              ? prev.filter(id => id !== s.id)
                              : [...prev, s.id])}
                            className="w-4 h-4 rounded border-white/[0.2] text-amber-500 focus:ring-amber-500 bg-white/[0.03] border-white/[0.1] transition-colors"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <div className="avatar avatar-sm bg-primary/10 text-primary">{getInitials(s.name)}</div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{s.name}</p>
                              <p className="text-xs text-text-tertiary">{s.email}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-white/[0.06]">
            <Button variant="ghost" onClick={() => setSelectedStudents([])} disabled={selectedStudents.length === 0}>
              Clear Selection
            </Button>
            <Button variant="primary" onClick={handleEnrollStudents} disabled={selectedStudents.length === 0 || saving}>
              Enroll {selectedStudents.length} Student(s)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminClassrooms;


