import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState({ overall: 0, courses: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAttendance = async () => {
      try {
        const response = await api.get(`/students/${user.id}/attendance`);
        setAttendance(response.data || { overall: 0, courses: [] });
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setAttendance({ overall: 0, courses: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [user]);

  const courseList = Array.isArray(attendance?.courses) ? attendance.courses : [];

  const getPercentageClass = (percentage) => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-danger';
  };

  if (loading) return <div className="container-fluid p-4"><div className="alert alert-info">Loading attendance...</div></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Attendance</h2>
      </div>
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Overall Attendance</h5>
              <div className="display-1 text-primary">{attendance.overall || 0}%</div>
              <div className="progress mt-2" style={{ height: '20px' }}>
                <div className="progress-bar" role="progressbar" style={{ width: `${attendance.overall || 0}%` }} aria-valuenow={attendance.overall || 0} aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Classes Attended</h5>
              <div className="display-1 text-success">{courseList.reduce((sum, c) => sum + (Number(c.attended) || 0), 0)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Total Classes</h5>
              <div className="display-1 text-info">{courseList.reduce((sum, c) => sum + (Number(c.total) || 0), 0)}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Course-wise Attendance</h5>
        </div>
        <div className="card-body">
          {courseList.length === 0 ? (
            <div className="text-center text-muted py-4">No attendance records available yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Code</th>
                    <th>Attended</th>
                    <th>Total</th>
                    <th>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courseList.map((course, index) => (
                    <tr key={index}>
                      <td>{course.name || course.course || "�"}</td>
                      <td>{course.code || "�"}</td>
                      <td>{course.attended}</td>
                      <td>{course.total}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="progress flex-grow-1 me-2" style={{ height: '15px' }}>
                            <div className="progress-bar" role="progressbar" style={{ width: `${course.percentage}%` }} aria-valuenow={course.percentage} aria-valuemin="0" aria-valuemax="100"></div>
                          </div>
                          <span>{course.percentage}%</span>
                        </div>
                      </td>
                      <td><span className={`badge ${getPercentageClass(course.percentage)}`}>{course.percentage >= 75 ? 'Good' : 'Low'}</span></td>
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

export default StudentAttendance;

