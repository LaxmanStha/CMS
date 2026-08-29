import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';

const FacultyAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAttendance = async () => {
      try {
        const response = await api.get(`/faculty/${user.id}/attendance`);
        setAttendance(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [user]);

  if (loading) return <div className="container-fluid p-4"><div className="alert alert-info">Loading attendance...</div></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Attendance Records</h2>
      </div>
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Student Attendance</h5>
        </div>
        <div className="card-body">
          {attendance.length === 0 ? (
            <div className="text-center text-muted py-4">No attendance records found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id}>
                      <td>{record.student}</td>
                      <td>{record.course}</td>
                      <td>{record.date}</td>
                      <td>
                        <span className={`badge ${record.status === 'present' ? 'bg-success' : record.status === 'absent' ? 'bg-danger' : 'bg-warning'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{record.time}</td>
                      <td>{record.notes || '-'}</td>
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

export default FacultyAttendance;
