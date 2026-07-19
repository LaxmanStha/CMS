import React from 'react';

const StudentDashboard = () => {
  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Student Dashboard</h2>
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
                You are enrolled in 5 courses this semester.
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
              <h5 className="card-title">Attendance</h5>
              <p className="card-text">
                Your attendance percentage is 85%.
              </p>
              <a href="#" className="btn btn-primary btn-sm">
                View Details
              </a>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Grades</h5>
              <p className="card-text">
                Your current GPA is 3.8.
              </p>
              <a href="#" className="btn btn-primary btn-sm">
                View Grades
              </a>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Fees</h5>
              <p className="card-text">
                You have a pending fee of $200.
              </p>
              <a href="#" className="btn btn-primary btn-sm">
                View Fees
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
