import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const EMPTY_FORM = {
  name: '',
  email: '',
  department: '',
  phone: '',
  status: 'active',
  password: '',
};

const AdminFaculty = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState({});

  const toggleReveal = (id) =>
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));

  const revealAll = () => {
    const next = {};
    if (faculty.some((f) => !revealed[f.id])) faculty.forEach((f) => (next[f.id] = true));
    setRevealed(next);
  };

  const load = async () => {
    try {
      const res = await api.get('/faculty');
      setFaculty(res.data || []);
    } catch (err) {
      setFaculty([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    if (!form.department.trim()) next.department = 'Department is required.';
    if (!form.password || form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/faculty', form);
      setShowModal(false);
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (typeof msg === 'string' && msg.toLowerCase().includes('name')) {
        setErrors({ name: 'Name is required.' });
      } else {
        setErrors({ form: msg || 'Failed to add faculty.' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Faculty</h2>
        <div>
          <button className="btn btn-primary me-2" onClick={openModal}>Add Faculty</button>
          {isAdmin && (
            <button className="btn btn-outline-secondary" onClick={revealAll}>
              {faculty.some((f) => !revealed[f.id]) ? 'Show All Passwords' : 'Hide All Passwords'}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Faculty List</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Status</th>
                  {isAdmin && <th>Password</th>}
                  <th>Actions</th>
                  </tr>
              </thead>
              <tbody>
                {faculty.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="text-center text-muted">
                      {loading ? 'Loading...' : 'No faculty found.'}
                    </td>
                  </tr>
                ) : (
                  faculty.map((f) => (
                    <tr key={f.id}>
                      <td>{f.id}</td>
                      <td>{f.name}</td>
                      <td>{f.email}</td>
                      <td>{f.department}</td>
                      <td>{f.phone}</td>
                      <td><span className={`badge bg-${f.status === 'active' ? 'success' : 'warning'}`}>{f.status}</span></td>
                      {isAdmin && (
                        <td>
                          <span className="me-1 font-monospace">{revealed[f.id] ? (f.password || '-') : '******'}</span>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => toggleReveal(f.id)}
                            disabled={!f.password}
                          >
                            {revealed[f.id] ? 'Hide' : 'Show'}
                          </button>
                        </td>
                      )}
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1">Edit</button>
                        <button className="btn btn-sm btn-outline-danger">Delete</button>
                      </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" tabIndex={-1}>
          <div className="w-full max-w-lg">
            <div className="modal-content bg-card max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="modal-header">
                <h5 className="modal-title">Add Faculty</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {errors.form && (
                    <div className="alert alert-danger py-2">{errors.form}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Full name"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      value={form.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      name="department"
                      className={`form-control ${errors.department ? 'is-invalid' : ''}`}
                      value={form.department}
                      onChange={handleChange}
                      placeholder="e.g. Computer Science"
                    />
                    {errors.department && <div className="invalid-feedback">{errors.department}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-control"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. 555-1234"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      name="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Set initial password"
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      className="form-select"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Faculty'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFaculty;

