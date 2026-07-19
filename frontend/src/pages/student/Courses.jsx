import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';

const StudentCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      try {
        const response = await api.get(`/students/${user.id}/courses`);
        setCourses(response.data);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setCourses([
          { id: 101, name: 'Mathematics 101', code: 'MATH101', faculty: 'Dr. Sarah Johnson', schedule: 'Mon/Wed/Fri 9:00 AM', credits: 3 },
          { id: 102, name: 'Physics 101', code: 'PHYS101', faculty: 'Prof. Michael Brown', schedule: 'Tue/Thu 10:30 AM', credits: 4 },
          { id: 103, name: 'Chemistry 101', code: 'CHEM101', faculty: 'Dr. Emily Davis', schedule: 'Mon/Wed 1:00 PM', credits: 4 },
          { id: 104, name: 'English Literature', code: 'ENG101', faculty: 'Prof. Robert Wilson', schedule: 'Tue/Thu 2:00 PM', credits: 3 },
          { id: 105, name: 'World History', code: 'HIST101', faculty: 'Dr. Lisa Anderson', schedule: 'Mon/Wed/Fri 11:00 AM', credits: 3 },
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
      </div>
      <div className="row">
        {courses.map(course => (
          <div key={course.id} className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{course.name} <small className="text-muted">({course.code})</small></h5>
                <p className="card-text">
                  <strong>Instructor:</strong> {course.faculty}<br />
                  <strong>Schedule:</strong> {course.schedule}<br />
                  <strong>Credits:</strong> {course.credits}
                </p>
                <div className="btn-group w-100" role="group">
                  <button className="btn btn-outline-primary">View Materials</button>
                  <button className="btn btn-outline-secondary">Assignments</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentCourses;

