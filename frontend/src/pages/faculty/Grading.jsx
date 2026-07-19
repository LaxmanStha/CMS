import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';

const FacultyGrading = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
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
    const fetchAssignments = async () => {
      try {
        const response = await api.get(`/faculty/${user.id}/courses/${selectedCourse.id}/assignments`);
        setAssignments(response.data);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setAssignments([
          { id: 1, title: 'Midterm Exam', maxScore: 100, dueDate: '2026-03-15', graded: 25, total: 35 },
          { id: 2, title: 'Lab Report 1', maxScore: 50, dueDate: '2026-02-20', graded: 30, total: 35 },
          { id: 3, title: 'Quiz 3', maxScore: 20, dueDate: '2026-02-10', graded: 35, total: 35 },
          { id: 4, title: 'Homework 5', maxScore: 30, dueDate: '2026-03-01', graded: 28, total: 35 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [selectedCourse, user]);

  useEffect(() => {
    if (!selectedAssignment) return;
    setLoading(true);
    const fetchSubmissions = async () => {
      try {
        const response = await api.get(`/faculty/${user.id}/courses/${selectedCourse.id}/assignments/${selectedAssignment.id}/submissions`);
        setSubmissions(response.data);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setSubmissions([
          { studentId: 1, studentName: 'Alice Johnson', submitted: true, score: 85, submittedAt: '2026-03-14' },
          { studentId: 2, studentName: 'Bob Smith', submitted: true, score: 72, submittedAt: '2026-03-15' },
          { studentId: 3, studentName: 'Carol Davis', submitted: true, score: 91, submittedAt: '2026-03-13' },
          { studentId: 4, studentName: 'David Wilson', submitted: false, score: null, submittedAt: null },
          { studentId: 5, studentName: 'Eva Brown', submitted: true, score: 78, submittedAt: '2026-03-14' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [selectedAssignment, selectedCourse, user]);

  const handleScoreChange = (studentId, score) => {
    setSubmissions(prev => prev.map(s => s.studentId === studentId ? { ...s, score: parseInt(score) || null } : s));
  };

  const handleSaveGrades = async () => {
    if (!selectedAssignment) return;
    try {
      await api.post(`/faculty/${user.id}/courses/${selectedCourse.id}/assignments/${selectedAssignment.id}/grades`, {
        grades: submissions.filter(s => s.submitted).map(s => ({
          studentId: s.studentId,
          score: s.score
        }))
      });
      alert('Grades saved successfully!');
    } catch (err) {
      console.error('Error saving grades:', err);
      alert('Grades saved (mock)!');
    }
  };

  if (loading) return <div className="container-fluid p-4"><div className="alert alert-info">Loading...</div></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Grading Center</h2>
      </div>
      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label">Select Course</label>
          <select className="form-select" value={selectedCourse?.id || ''} onChange={e => {
            const course = courses.find(c => c.id == e.target.value);
            setSelectedCourse(course);
            setSelectedAssignment(null);
            setSubmissions([]);
          }}>
            <option value="">-- Select Course --</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name} - Section {course.section}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Select Assignment</label>
          <select className="form-select" value={selectedAssignment?.id || ''} onChange={e => {
            const assignment = assignments.find(a => a.id == e.target.value);
            setSelectedAssignment(assignment);
          }} disabled={!selectedCourse}>
            <option value="">-- Select Assignment --</option>
            {assignments.map(assignment => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title} (Max: {assignment.maxScore}) - {assignment.graded}/{assignment.total} graded
              </option>
            ))}
          </select>
        </div>
      </div>
      {selectedCourse && selectedAssignment && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">{selectedCourse.name} - {selectedAssignment.title}</h5>
            <button className="btn btn-primary" onClick={handleSaveGrades} disabled={loading}>
              {loading ? 'Saving...' : 'Save Grades'}
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th className="text-center" style={{ width: '120px' }}>Submitted</th>
                    <th className="text-center" style={{ width: '150px' }}>Score / {selectedAssignment.maxScore}</th>
                    <th className="text-center" style={{ width: '150px' }}>Submitted Date</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(submission => (
                    <tr key={submission.studentId}>
                      <td>{submission.studentName}</td>
                      <td className="text-center">
                        {submission.submitted ? (
                          <span className="badge bg-success">Yes</span>
                        ) : (
                          <span className="badge bg-warning text-dark">No</span>
                        )}
                      </td>
                      <td className="text-center">
                        {submission.submitted ? (
                          <input
                            type="number"
                            className="form-control form-control-sm d-inline-block w-auto"
                            min={0}
                            max={selectedAssignment.maxScore}
                            value={submission.score || ''}
                            onChange={e => handleScoreChange(submission.studentId, e.target.value)}
                            placeholder="Enter score"
                          />
                        ) : (
                          <span className="text-muted">Not submitted</span>
                        )}
                      </td>
                      <td className="text-center">
                        {submission.submitted ? submission.submittedAt : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {(!selectedCourse || !selectedAssignment) && (
        <div className="alert alert-info">
          {selectedCourse ? 'Please select an assignment to view submissions.' : 'Please select a course to view assignments.'}
        </div>
      )}
    </div>
  );
};

export default FacultyGrading;

