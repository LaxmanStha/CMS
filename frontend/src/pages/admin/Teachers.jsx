import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Edit, Trash2, Users, UserCheck, UserCog, Eye, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { formatDate, getInitials } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";

const STATUSES = ["active", "on_leave", "inactive"];

const statusLabel = (s) => s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

const AdminTeachers = () => {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    assignedClassrooms: [],
    assignedCourse: "",
    status: "active",
    hireDate: "",
    password: "",
  });
  const [revealed, setRevealed] = useState({});

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/teachers");
      setTeachers(Array.isArray(res.data) ? res.data.map(t => ({
        ...t,
        department: typeof t.department === 'string' ? t.department : t.department?.name || '',
        assignedCourse: typeof t.assignedCourse === 'string' ? t.assignedCourse : t.assignedCourse?.name || '',
        assignedClassrooms: String(t.assignedClassroom || '').split(',').map(room => room.trim()).filter(Boolean),
      })) : []);
    } catch {
      showError("Failed to load teachers");
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const fetchClassrooms = useCallback(async () => {
    try {
      const res = await api.get("/classrooms");
      setClassrooms(Array.isArray(res.data) ? res.data : []);
    } catch {
      setClassrooms([]);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

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

  const classroomOptions = useMemo(() => {
    const seen = new Set();
    return classrooms
      .filter((c) => {
        const roomNum = c.room_number || `Room ${c.id}`;
        if (seen.has(roomNum)) return false;
        seen.add(roomNum);
        return true;
      })
      .map((c) => ({
        value: String(c.id),
        label: `${c.room_number || 'Room ' + c.id} - ${c.name}`,
      }));
  }, [classrooms]);

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

  const handleOpenModal = useCallback((t = null) => {
    if (t) {
      setEditingTeacher(t);
      setFormData({
        name: t.name || "",
        email: t.email || "",
        phone: t.phone || "",
        department: t.department || "",
        assignedClassrooms: t.assignedClassrooms || String(t.assignedClassroom || '').split(',').map(room => room.trim()).filter(Boolean),
        assignedCourse: t.assignedCourse || "",
        status: t.status || "active",
        hireDate: t.hireDate || "",
        password: "",
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        department: "",
        assignedClassrooms: [],
        assignedCourse: "",
        status: "active",
        hireDate: "",
        password: "",
      });
    }
    setShowModal(true);
  }, []);

  const toggleReveal = (id) =>
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        assignedClassroom: formData.assignedClassrooms.join(', '),
        assignedCourse: formData.assignedCourse,
        status: formData.status,
        hireDate: formData.hireDate,
      };
      if (formData.password) payload.password = formData.password;
      if (editingTeacher) {
        await api.put(`/teachers/${editingTeacher.id}`, payload);
        success("Teacher updated successfully");
      } else {
        if (!formData.password) {
          showError("Password is required for new teachers");
          setSaving(false);
          return;
        }
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

  const columns = [
    { key: "id", header: "Teacher ID", width: "100px", render: (val) => val != null ? `TCH${String(val).padStart(3, "0")}` : "-" },
    { key: "name", header: "Name", render: (val, row) => (
      <div className="flex items-center gap-3">
        <div className="avatar avatar-sm bg-primary/10 text-primary">{getInitials(row.name || "?")}</div>
        <div>
          <p className="font-medium text-text-primary">{row.name}</p>
          <p className="text-xs text-text-secondary">{row.email}</p>
        </div>
      </div>
    )},
    { key: "department", header: "Department", width: "150px", render: (val) => <Badge variant="default">{val || "?"}</Badge> },
    { key: "assignedCourse", header: "Course", width: "150px", render: (val) => <Badge variant="default">{val || "?"}</Badge> },
    { key: "assignedClassroom", header: "Classrooms", width: "180px", render: (val, row) => (row.assignedClassrooms || String(val || '').split(',').map(room => room.trim()).filter(Boolean)).join(', ') || "-" },
    { key: "phone", header: "Phone", width: "140px", render: (val) => val || "-" },
    { key: "status", header: "Status", width: "120px", render: (val) => {
      const status = val || "active";
      return (
        <Badge variant={status === "active" ? "success" : status === "on_leave" ? "warning" : "default"}>
          {statusLabel(status)}
        </Badge>
      );
    }},
    { key: "password", header: "Password", width: "140px", render: (val, row) => (
      <div className="d-flex align-items-center gap-2">
        <span className="font-monospace text-muted small">
          {revealed[row.id] ? (row.password || '—') : '••••••'}
        </span>
        {row.password && (
          <button
            className="btn btn-sm btn-outline-secondary p-1"
            onClick={(e) => { e.stopPropagation(); toggleReveal(row.id); }}
            title={revealed[row.id] ? 'Hide' : 'Show'}
          >
            <Eye className="w-3 h-3" />
          </button>
        )}
      </div>
    )},
    { key: "hireDate", header: "Hired", width: "120px", render: (val) => formatDate(val) },
  ];

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-text-primary">Manage Teachers</h2>
        <div>
          {isAdmin && <button className="btn btn-primary me-2" onClick={() => handleOpenModal()}><Plus className="w-4 h-4 me-1" />Add Teacher</button>}
          {!isAdmin && <span className="text-sm text-text-secondary bg-white/[0.03] px-3 py-1.5 rounded-lg">Read-only (admin only)</span>}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col">
          <div className="card bg-primary/10">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded bg-blue-500/10 text-blue-500" style={{ width: 44, height: 44 }}>
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="h4 mb-0 text-text-primary">{stats.total}</p>
                <p className="text-xs text-text-tertiary">Total Faculty</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card bg-success/10">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded bg-emerald-500/10 text-emerald-500" style={{ width: 44, height: 44 }}>
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="h4 mb-0 text-text-primary">{stats.active}</p>
                <p className="text-xs text-text-secondary mb-0">Active</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card bg-warning/10">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded bg-amber-500/10 text-amber-500" style={{ width: 44, height: 44 }}>
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <p className="h4 mb-0 text-text-primary">{stats.onLeave}</p>
                <p className="text-xs text-text-tertiary mb-0">On Leave</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="card-title mb-0">Teacher List</h5>
            <div className="d-flex gap-2 flex-wrap">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={() => setSearchTerm("")}
                placeholder="Search teachers..."
                className="w-auto min-w-[200px]"
              />
              <Select
                trigger="hover"
                value={deptFilter}
                onChange={setDeptFilter}
                options={[{ value: "", label: "All Departments" }, ...departmentOptions]}
                placeholder="All Departments"
                className="w-auto min-w-[140px]"
              />
              <Select
                trigger="hover"
                value={courseFilter}
                onChange={setCourseFilter}
                options={[{ value: "", label: "All Courses" }, ...courseOptions]}
                placeholder="All Courses"
                className="w-auto min-w-[140px]"
              />
              <Select
                trigger="hover"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[{ value: "", label: "All Status" }, ...STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))]}
                placeholder="All Status"
                className="w-auto min-w-[140px]"
              />
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <Table
              columns={columns}
              data={filteredTeachers}
              keyField="id"
              searchable={false}
              filterable={false}
              paginated
              pageSize={10}
              loading={loading}
              rowActions={isAdmin ? [
                { label: "Edit", icon: <Edit className="w-4 h-4" />, onClick: handleOpenModal, variant: "ghost" },
                { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: handleDelete, variant: "danger" },
              ] : []}
              emptyMessage={"No teachers found"}
            />
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTeacher ? "Edit Teacher" : "Add Teacher"} size="lg"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>{isAdmin && <Button onClick={handleSubmit} loading={saving}>{editingTeacher ? "Update" : "Create"}</Button>}</>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Dr. John Smith" required />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="prof@college.edu" required />
            <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder={editingTeacher ? "Leave blank to keep" : "Set initial password"} />
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1-555-0000" />
            <Select
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              options={departmentOptions}
              placeholder="Select Department"
              required
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">Classrooms</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                {classroomOptions.map((option) => {
                  const classroom = classrooms.find((item) => String(item.id) === option.value);
                  const roomNumber = classroom?.room_number || option.label.split(' - ')[0];
                  const assignmentNames = [roomNumber, classroom?.name, classroom?.section_name].filter(Boolean);
                  return (
                    <label key={option.value} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-white/[0.04] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignmentNames.some((name) => formData.assignedClassrooms.includes(name))}
                        onChange={(e) => setFormData((previous) => ({
                          ...previous,
                          assignedClassrooms: e.target.checked
                            ? [...previous.assignedClassrooms, roomNumber]
                            : previous.assignedClassrooms.filter((room) => room !== roomNumber),
                        }))}
                        className="h-4 w-4 accent-primary"
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
                {!classroomOptions.length && <span className="text-sm text-text-tertiary">No classrooms available</span>}
              </div>
            </div>
            <Select
              label="Assigned Course"
              value={formData.assignedCourse}
              onChange={(e) => setFormData({...formData, assignedCourse: e.target.value})}
              options={courseOptions}
              placeholder="Select Course"
            />
            <select className="select-themed" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
            <Input label="Hire Date" type="date" value={formData.hireDate} onChange={(e) => setFormData({...formData, hireDate: e.target.value})} />
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Teacher" variant="danger" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></>}
      >
        <p className="text-text-secondary">Delete <strong>{deleteConfirm?.name}</strong> (TCH{String(deleteConfirm?.id).padStart(3, "0")})? This cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default AdminTeachers;