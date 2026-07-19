import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const [facultyData, setFacultyData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, total: 0 });
  const [pendingGrades, setPendingGrades] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch faculty data when the user logs in or user changes
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch faculty profile
        const profileResponse = await api.get(`/faculty/${user.id}`);
        setFacultyData(profileResponse.data);

        // Fetch courses taught by this faculty
        const coursesResponse = await api.get(`/faculty/${user.id}/courses`);
        setCourses(coursesResponse.data);

        // Fetch today's attendance
        const attendanceResponse = await api.get(`/faculty/${user.id}/attendance/today`);
        setTodayAttendance(attendanceResponse.data);

        // Fetch pending grades
        const gradesResponse = await api.get(`/faculty/${user.id}/grades/pending`);
        setPendingGrades(gradesResponse.data);

        // Fetch upcoming classes
        const classesResponse = await api.get(`/faculty/${user.id}/classes/upcoming`);
        setUpcomingClasses(classesResponse.data);

        // Fetch announcements
        const announcementsResponse = await api.get(`/faculty/${user.id}/announcements`);
        setAnnouncements(announcementsResponse.data);
      } catch (err) {
        console.error('Error fetching faculty data:', err);
        setError('Failed to load dashboard data. Using mock data.');
        // Fallback to mock data for development
        setFacultyData({ id: user.id, name: user.name, email: user.email, totalStudents: 75 });
        setCourses([
          { id: 201, name: 'Mathematics 101', code: 'MATH101', section: 'A' },
          { id: 202, name: 'Physics 101', code: 'PHYS101', section: 'B' },
          { id: 203, name: 'Chemistry 101', code: 'CHEM101', section: 'A' }
        ]);
        setTodayAttendance({ present: 78, total: 85 });
        setPendingGrades([
          { student: 'Alice Johnson', assignment: 'Midterm Exam', course: 'Mathematics 101' },
          { student: 'Bob Smith', assignment: 'Lab Report', course: 'Physics 101' },
          { student: 'Carol Davis', assignment: 'Quiz 3', course: 'Chemistry 101' }
        ]);
        setUpcomingClasses([
          { course: 'Mathematics 101', time: 'Mon/Wed/Fri 9:00 AM', room: 'Room 101' },
          { course: 'Physics 101', time: 'Tue/Thu 10:30 AM', room: 'Room 102' },
          { course: 'Chemistry 101', time: 'Mon/Wed 1:00 PM', room: 'Room 103' }
        ]);
        setAnnouncements([
          'Midterm exams scheduled for next week.',
          'Please submit your grades by Friday.',
          'Office hours changed to 2-4 PM on Mondays.'
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]); // Re-fetch when user changes

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Faculty Dashboard</h2>
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
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Faculty Dashboard</h2>
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
              <h5 className="card-title">Courses Taught</h5>
              <p className="display-5">{courses.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Students Taught</h5>
              <p className="display-5">{facultyData?.totalStudents || 75}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Today's Attendance</h5>
              <p className="display-5">
                {todayAttendance.present}/{todayAttendance.total}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Pending Grading</h5>
              <p className="display-5">{pendingGrades.length}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title">Upcoming Classes</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                {upcomingClasses.map((cls, index) => (
                  <li key={index} className="list-group-item">
                    {cls.course} - {cls.time} ({cls.room})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card dark-card h-100">
            <div className="card-header border-white/10">
              <h5 className="card-title text-white">Recent Announcements</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                {announcements.map((announcement, index) => (
                  <li key={index} className="list-group-item bg-transparent text-white/80 border-white/10">
                    {announcement}
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

export default FacultyDashboard;

