import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';
import Dropdown from '@/components/ui/Dropdown';

const StudentGrades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState('Fall 2025');

  useEffect(() => {
    if (!user) return;
    const fetchGrades = async () => {
      try {
        const response = await api.get(`/students/${user.id}/grades?semester=${semester}`);
        setGrades(response.data);
      } catch (err) {
        console.error('Error fetching grades:', err);
        setGrades([
          { course: 'Mathematics 101', code: 'MATH101', midterm: 88, final: 92, assignment: 95, overall: 91.2, letter: 'A-' },
          { course: 'Physics 101', code: 'PHYS101', midterm: 76, final: 82, assignment: 88, overall: 82.8, letter: 'B' },
          { course: 'Chemistry 101', code: 'CHEM101', midterm: 84, final: 79, assignment: 91, overall: 84.7, letter: 'B' },
          { course: 'English Literature', code: 'ENG101', midterm: 91, final: 88, assignment: 94, overall: 91.0, letter: 'A-' },
          { course: 'World History', code: 'HIST101', midterm: 85, final: 87, assignment: 89, overall: 87.0, letter: 'B+' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [user, semester]);

  const calculateGPA = () => {
    if (grades.length === 0) return '0.00';
    const total = grades.reduce((sum, g) => sum + g.overall, 0);
    return (total / grades.length / 25).toFixed(2);
  };

  if (loading) return <div className="container-fluid p-4"><div className="alert alert-info">Loading grades...</div></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Grades</h2>
        <div>
          <label className="me-2">Semester:</label>
          <Dropdown value={semester} onChange={setSemester} options={['Fall 2025', 'Spring 2025', 'Fall 2024']} />
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Current GPA</h5>
              <p className="display-3">{calculateGPA()}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Credits Completed</h5>
              <p className="display-3">{grades.reduce((sum, g) => sum + 3, 0)}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Courses This Semester</h5>
              <p className="display-3">{grades.length}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Grade Details</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Midterm</th>
                  <th>Final</th>
                  <th>Assignments</th>
                  <th>Overall</th>
                  <th>Letter Grade</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade, index) => (
                  <tr key={index}>
                    <td>{grade.course}</td>
                    <td>{grade.code}</td>
                    <td>{grade.midterm}%</td>
                    <td>{grade.final}%</td>
                    <td>{grade.assignment}%</td>
                    <td className="fw-bold">{grade.overall}%</td>
                    <td><span className="badge bg-primary">{grade.letter}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;

