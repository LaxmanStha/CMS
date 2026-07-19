import React from 'react';

const FacultyDashboard = () => {
  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Faculty Dashboard</h2>
        <div>
          <button className="btn btn-outline-secondary me-2">Profile</button>
          <button className="btn btn-primary">Logout</button>
        </div>
      </div>
      <div className="row">
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">My Courses</h5>
              <p className="card-text">
                You are teaching 3 courses this semester.
              </p>
              <a href="#" className="btn btn-primary btn-sm">
                View Courses
              </a>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Attendance Entry</h5>
              <p className="card-text">
                Mark attendance for your classes.
              </p>
              <a href="#" className="btn btn-primary btn-sm">
                Take Attendance
              </a>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Grading</h5>
              <p className="card-text">
                Enter grades for assignments and exams.
              </p>
              <a href="#" className="btn btn-primary btn-sm">
                Enter Grades
              </a>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Schedule</h5>
              <p className="card-text">
                View your teaching schedule.
              </p>
              <a href="#" className="btn btn-primary btn-sm">
                View Schedule
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
