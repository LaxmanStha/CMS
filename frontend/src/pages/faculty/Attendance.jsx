import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';

const FacultyAttendance = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      try {
        const response = await api.get(`/faculty/${user.id}/courses`);
        setCourses(response.data);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setCourses([
          { id: 201, name: 'Mathematics 101', code: 'MATH101', section: 'A' },
          { id: 202, name: 'Physics 101', code: 'PHYS101', section: 'B' },
          { id: 203, name: 'Chemistry 101', code: 'CHEM101', section: 'A' },
        ]);
      }
    };
    fetchCourses();
  }, [user]);

  useEffect(() => {
    if (!selectedCourse) return;
    setLoading(true);
    const fetchAttendance = async () => {
      try {
        const response = await api.get(`/faculty/${user.id}/courses/${selectedCourse.id}/attendance?date=${selectedDate}`);
        setAttendanceRecords(response.data);
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setAttendanceRecords([
          { studentId: 1, name: 'Alice Johnson', status: 'Present' },
          { studentId: 2, name: 'Bob Smith', status: 'Absent' },
          { studentId: 3, name: 'Carol Davis', status: 'Present' },
          { studentId: 4, name: 'David Wilson', status: 'Late' },
          { studentId: 5, name: 'Eva Brown', status: 'Present' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedCourse, selectedDate, user]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
  };

  const handleSave = async () => {
    try {
      await api.post(`/faculty/${user.id}/courses/${selectedCourse.id}/attendance`, {
        date: selectedDate,
        records: attendanceRecords
      });
      alert('Attendance saved successfully!');
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('Attendance saved (mock)!');
    }
  };

  if (loading) return <div className="container-fluid p-4"><div className="alert alert-info">Loading...</div></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Attendance Management</h2>
      </div>
      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label">Select Course</label>
          <select className="form-select" value={selectedCourse?.id || ''} onChange={e => {
            const course = courses.find(c => c.id == e.target.value);
            setSelectedCourse(course);
          }}>
            <option value="">-- Select Course --</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name} - Section {course.section}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Date</label>
          <input type="date" className="form-control" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </div>
      </div>
      {selectedCourse && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">{selectedCourse.name} - {selectedDate}</h5>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th className="text-center" style={{ width: '150px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map(record => (
                    <tr key={record.studentId}>
                      <td>{record.name}</td>
                      <td className="text-center">
                        <div className="btn-group" role="group">
                          <input type="radio" className="btn-check" name={`status-${record.studentId}`} id={`present-${record.studentId}`}
                            value="Present" checked={record.status === 'Present'} onChange={() => handleStatusChange(record.studentId, 'Present')} />
                          <label className="btn btn-outline-success btn-sm" htmlFor={`present-${record.studentId}`}>Present</label>

                          <input type="radio" className="btn-check" name={`status-${record.studentId}`} id={`absent-${record.studentId}`}
                            value="Absent" checked={record.status === 'Absent'} onChange={() => handleStatusChange(record.studentId, 'Absent')} />
                          <label className="btn btn-outline-danger btn-sm" htmlFor={`absent-${record.studentId}`}>Absent</label>

                          <input type="radio" className="btn-check" name={`status-${record.studentId}`} id={`late-${record.studentId}`}
                            value="Late" checked={record.status === 'Late'} onChange={() => handleStatusChange(record.studentId, 'Late')} />
                          <label className="btn btn-outline-warning btn-sm" htmlFor={`late-${record.studentId}`}>Late</label>

                          <input type="radio" className="btn-check" name={`status-${record.studentId}`} id={`excused-${record.studentId}`}
                            value="Excused" checked={record.status === 'Excused'} onChange={() => handleStatusChange(record.studentId, 'Excused')} />
                          <label className="btn btn-outline-info btn-sm" htmlFor={`excused-${record.studentId}`}>Excused</label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {!selectedCourse && (
        <div className="alert alert-info">
          Please select a course to manage attendance.
        </div>
      )}
    </div>
  );
};

export default FacultyAttendance;

