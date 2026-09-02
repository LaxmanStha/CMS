import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { formatDate, getInitials } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";

const AdminClassrooms = () => {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ room_number: "", name: "" });

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

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleOpenModal = (c = null) => {
    if (c) {
      setEditingClassroom(c);
      setFormData({
        room_number: c.room_number || "",
        name: c.name || "",
      });
    } else {
      setEditingClassroom(null);
      setFormData({ room_number: "", name: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClassroom(null);
    setFormData({ room_number: "", name: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        room_number: formData.room_number,
        name: formData.name,
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
      success(`${deleteConfirm.room_number} (${deleteConfirm.name}) has been deleted`);
      setDeleteConfirm(null);
      await fetchClassrooms();
    } catch (err) {
      showError(err.response?.data?.message || err.response?.data || "Failed to delete classroom");
    }
  };

  const stats = useMemo(() => ({
    total: classrooms.length,
  }), [classrooms]);

  const columns = useMemo(() => [
    { key: "id", header: "ID", width: "60px", render: (val) => val != null ? val : "-" },
    { key: "room_number", header: "Room No.", width: "100px", render: (val) => val || "-" },
    { key: "name", header: "Name", width: "200px", render: (val) => val || "-" },
  ], []);

  const filteredClassrooms = useMemo(() => classrooms.filter((c) => {
    const matchesSearch = !searchTerm ||
      String(c.room_number).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(c.name).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }), [classrooms, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-header-title">Classrooms</h1>
            <p className="page-header-subtitle">Manage classrooms</p>
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
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            <p className="text-xs text-text-tertiary">Total Classrooms</p>
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
              { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: handleDelete, variant: "danger" },
            ] : []}
            emptyMessage={"No classrooms found"}
          />
        </div>
      </div>

      {/* Add/Edit Classroom Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingClassroom(null); setFormData({ room_number: "", name: "" }); }} title={editingClassroom ? "Edit Classroom" : "Add Classroom"} size="lg"
        footer={<><Button variant="ghost" onClick={() => { setShowModal(false); setEditingClassroom(null); setFormData({ room_number: "", name: "" }); }} disabled={saving}>Cancel</Button>{isAdmin && <Button onClick={handleSubmit} loading={saving}>{editingClassroom ? "Update" : "Create"}</Button>}</>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Room Number" value={formData.room_number} onChange={(e) => setFormData({...formData, room_number: e.target.value})} placeholder="e.g. 101" required />
            <Input label="Classroom Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. CS-A, Lab 1" required />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Classroom" variant="danger" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete</Button></>}
      >
        <p className="text-text-secondary">Delete <strong>{deleteConfirm?.room_number} ({deleteConfirm?.name})</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default AdminClassrooms;