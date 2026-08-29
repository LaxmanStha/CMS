import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';

const FacultyGrading = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchGrades = async () => {
      try {
        const response = await api.get(`/faculty/${user.id}/grades/pending`);
        setGrades(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching grades:', err);
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [user]);

  if (loading) return <div className="container-fluid p-4"><div className="alert alert-info">Loading grades...</div></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Grading Center</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Pending Grades</h5>
        </div>
        <div className="card-body">
          {grades.length === 0 ? (
            <div className="text-center text-muted py-4">No pending grades at this time.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Exam</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade) => (
                    <tr key={grade.id}>
                      <td>{grade.student}</td>
                      <td>{grade.course}</td>
                      <td>{grade.exam || '-'}</td>
                      <td>
                        <span className="badge bg-warning">Pending</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyGrading;
