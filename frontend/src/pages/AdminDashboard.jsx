import React, { useEffect, useState } from 'react';
import api from '@/services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, faculty: 0, courses: 0, pending: 0 });
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [students, faculty, courses, enroll] = await Promise.all([
          api.get('/students'),
          api.get('/faculty'),
          api.get('/courses'),
          api.get('/enrollments'),
        ]);
        const studentList = students.data || [];
        setStats({
          students: studentList.length,
          faculty: (faculty.data || []).length,
          courses: (courses.data || []).length,
          pending: studentList.filter((s) => s.status === 'pending').length,
        });
        setEnrollments((enroll.data || []).slice(0, 5));
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    { title: 'Total Students', value: stats.students },
    { title: 'Total Faculty', value: stats.faculty },
    { title: 'Total Courses', value: stats.courses },
    { title: 'Pending Applications', value: stats.pending },
  ];

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Dashboard</h2>
        <div>
          <button className="btn btn-outline-secondary me-2">Profile</button>
          <button className="btn btn-primary">Logout</button>
        </div>
      </div>
      {error && <div className="alert alert-danger mb-3">{error}</div>}
      <div className="row">
        {cards.map((card) => (
          <div className="col-md-3" key={card.title}>
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{card.title}</h5>
                <p className="display-5">{loading ? '...' : card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
        <div className="row mt-4">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="card-title">Recent Enrollments</h5>
              </div>
              <div className="card-body">
                {enrollments.length === 0 ? (
                  <p className="text-muted mb-0">No enrollments found.</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {enrollments.map((e, i) => (
                      <li className="list-group-item" key={i}>
                        {e.student} enrolled in {e.course}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card dark-card h-100">
              <div className="card-header border-white/10">
                <h5 className="card-title text-white">System Alerts</h5>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item bg-transparent text-white/80 border-white/10">
                    Server maintenance scheduled for Sunday 2 AM - 4 AM.
                  </li>
                  <li className="list-group-item bg-transparent text-white/80 border-white/10">
                    New course catalog is now available.
                  </li>
                  <li className="list-group-item bg-transparent text-white/80 border-white/10">
                    Please review the updated grading policy.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default AdminDashboard;
