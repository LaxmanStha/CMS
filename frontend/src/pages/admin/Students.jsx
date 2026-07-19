import React, { useEffect, useState } from 'react';
import api from '@/services/api';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/students');
        setStudents(res.data || []);
      } catch (err) {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Students</h2>
        <button className="btn btn-primary">Add Student</button>
      </div>
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Student List</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      {loading ? 'Loading...' : 'No students found.'}
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{s.program}</td>
                      <td><span className={`badge bg-${s.status === 'active' ? 'success' : s.status === 'pending' ? 'warning text-dark' : 'secondary'}`}>{s.status}</span></td>
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
    </div>
  );
};

export default AdminStudents;
