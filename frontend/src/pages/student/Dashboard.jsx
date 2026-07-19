import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState(0);
  const [feeStatus, setFeeStatus] = useState({ status: 'Paid', amount: 0 });
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [faculty, setFaculty] = useState([]);
  const [advisor, setAdvisor] = useState('');
  const [savingAdvisor, setSavingAdvisor] = useState(false);

  // Fetch student data when the user logs in or user changes
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch student profile
        const profileResponse = await api.get(`/students/${user.id}`);
        setStudentData(profileResponse.data);

        // Fetch courses
        const coursesResponse = await api.get(`/students/${user.id}/courses`);
        setCourses(coursesResponse.data);

        // Fetch attendance
        const attendanceResponse = await api.get(`/students/${user.id}/attendance`);
        setAttendance(attendanceResponse.data.percentage || 0);

        // Fetch fee status
        const feeResponse = await api.get(`/students/${user.id}/fees`);
        setFeeStatus(feeResponse.data);

        // Fetch upcoming exams
        const examsResponse = await api.get(`/students/${user.id}/exams/upcoming`);
        setUpcomingExams(examsResponse.data);

        // Fetch recent grades
        const gradesResponse = await api.get(`/students/${user.id}/grades/recent`);
        setRecentGrades(gradesResponse.data);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to load dashboard data. Using mock data.');
        // Fallback to mock data for development
        setStudentData({ id: user.id, name: user.name, email: user.email, gpa: 3.85, cgpa: 3.80 });
        setCourses([
          { id: 101, name: 'Mathematics', code: 'MATH101' },
          { id: 102, name: 'Physics', code: 'PHYS101' },
          { id: 103, name: 'Chemistry', code: 'CHEM101' },
          { id: 104, name: 'English', code: 'ENG101' },
          { id: 105, name: 'History', code: 'HIST101' }
        ]);
        setAttendance(95);
        setFeeStatus({ status: 'Paid', amount: 0 });
        setUpcomingExams([
          { course: 'Mathematics', date: 'May 10, 2026' },
          { course: 'Physics', date: 'May 12, 2026' },
          { course: 'Chemistry', date: 'May 15, 2026' }
        ]);
        setRecentGrades([
          { course: 'Mathematics', grade: 'A' },
          { course: 'Physics', grade: 'A-' },
          { course: 'Chemistry', grade: 'B+' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]); // Re-fetch when user changes

  const fetchFaculty = async () => {
    try {
      const res = await api.get('/faculty');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setFaculty(list);
    } catch (err) {
      setFaculty([]);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleAdvisorChange = async (e) => {
    const value = e.target.value;
    setAdvisor(value);
    try {
      setSavingAdvisor(true);
      await api.put(`/students/${user.id}`, { name: user.name, email: user.email, advisor: value || null });
    } catch (err) {
      // Non-blocking: the selection still persists in local state.
    } finally {
      setSavingAdvisor(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Student Dashboard</h2>
          <div>
            <button className="btn btn-outline-secondary me-2">Profile</button>
            <button className="btn btn-primary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="alert alert-info">Loading dashboard data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    // We'll still show the data but with an error banner
    // In a real app, you might want to show an error page or retry
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Student Dashboard</h2>
        <div>
          <button className="btn btn-outline-secondary me-2">Profile</button>
          <button className="btn btn-primary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      {error && (
        <div className="alert alert-danger mb-3">
          {error}
        </div>
      )}
      <div className="row">
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Current GPA</h5>
              <p className="display-5">{studentData?.gpa?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Attendance</h5>
              <p className="display-5">{attendance}%</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Courses Enrolled</h5>
              <p className="display-5">{courses.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Fee Status</h5>
              <p className="display-5 text-success">{feeStatus.status || 'Paid'}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-md-12">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Choose Your Faculty Advisor</h5>
              {savingAdvisor && <span className="text-muted small">Saving...</span>}
            </div>
            <div className="card-body">
              <p className="text-muted mb-3">Select a faculty member from the college to be your advisor.</p>
              <select className="form-select" value={advisor} onChange={handleAdvisorChange}>
                <option value="">Select Faculty</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.name}>{f.name} ({f.department || 'Faculty'})</option>
                ))}
              </select>
              {advisor && (
                <div className="alert alert-success mt-3 mb-0">
                  Your advisor is <strong>{advisor}</strong>.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title">Upcoming Exams</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                {upcomingExams.map((exam, index) => (
                  <li key={index} className="list-group-item">
                    {exam.course} - {exam.date}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title">Recent Grades</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                {recentGrades.map((grade, index) => (
                  <li key={index} className="list-group-item">
                    {grade.course}: {grade.grade}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

