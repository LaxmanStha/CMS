import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';

const FacultyCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
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
          { id: 201, name: 'Mathematics 101', code: 'MATH101', section: 'A', students: 35, schedule: 'Mon/Wed/Fri 9:00 AM', room: 'Room 101' },
          { id: 202, name: 'Physics 101', code: 'PHYS101', section: 'B', students: 28, schedule: 'Tue/Thu 10:30 AM', room: 'Room 201' },
          { id: 203, name: 'Chemistry 101', code: 'CHEM101', section: 'A', students: 32, schedule: 'Mon/Wed 1:00 PM', room: 'Lab 301' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  if (loading) return <div className="container-fluid p-4"><div className="alert alert-info">Loading courses...</div></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Courses</h2>
        <button className="btn btn-primary">Add Course</button>
      </div>
      <div className="row">
        {courses.map(course => (
          <div key={course.id} className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{course.name} <small className="text-muted">({course.code} - Section {course.section})</small></h5>
                <p className="card-text">
                  <strong>Students:</strong> {course.students}<br />
                  <strong>Schedule:</strong> {course.schedule}<br />
                  <strong>Room:</strong> {course.room}
                </p>
                <div className="btn-group w-100" role="group">
                  <button className="btn btn-outline-primary">View Roster</button>
                  <button className="btn btn-outline-secondary">Attendance</button>
                  <button className="btn btn-outline-secondary">Grading</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacultyCourses;

