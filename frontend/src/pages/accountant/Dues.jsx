import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';
import Dropdown from '@/components/ui/Dropdown';

const AccountantDues = () => {
  const { user } = useAuth();
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetchDues = async () => {
      try {
        const response = await api.get(`/accountant/dues`);
        setDues(response.data);
      } catch (err) {
        console.error('Error fetching dues:', err);
        setDues([
          { id: 1, student: 'John Doe', studentId: 'STU001', course: 'Fall 2025', totalFees: 5000, paid: 5000, due: 0, status: 'Paid' },
          { id: 2, student: 'Jane Smith', studentId: 'STU002', course: 'Fall 2025', totalFees: 5000, paid: 2500, due: 2500, status: 'Partial' },
          { id: 3, student: 'Bob Johnson', studentId: 'STU003', course: 'Fall 2025', totalFees: 5000, paid: 0, due: 5000, status: 'Unpaid' },
          { id: 4, student: 'Alice Williams', studentId: 'STU004', course: 'Fall 2025', totalFees: 5000, paid: 5000, due: 0, status: 'Paid' },
          { id: 5, student: 'Charlie Brown', studentId: 'STU005', course: 'Fall 2025', totalFees: 5000, paid: 1000, due: 4000, status: 'Partial' },
          { id: 6, student: 'Diana Prince', studentId: 'STU006', course: 'Fall 2025', totalFees: 5000, paid: 0, due: 5000, status: 'Unpaid' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDues();
  }, [user]);

  const filteredDues = dues.filter(due => {
    const matchesSearch = due.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         due.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || due.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const summary = filteredDues.reduce((acc, due) => {
    acc.totalFees += due.totalFees;
    acc.totalPaid += due.paid;
    acc.totalDue += due.due;
    return acc;
  }, { totalFees: 0, totalPaid: 0, totalDue: 0 });

  const statusColors = {
    Paid: 'bg-success',
    Partial: 'bg-warning',
    Unpaid: 'bg-danger'
  };

  if (loading) return <div className="container-fluid p-4"><div className="alert alert-info">Loading dues...</div></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Fee Dues</h2>
      </div>
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Total Fees</h5>
              <p className="display-4">${summary.totalFees.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Total Paid</h5>
              <p className="display-4">${summary.totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Total Due</h5>
              <p className="display-4">${summary.totalDue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Collection Rate</h5>
              <p className="display-4">{summary.totalFees > 0 ? ((summary.totalPaid / summary.totalFees) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search students..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <Dropdown value={filterStatus} onChange={setFilterStatus} options={[{ value: 'all', label: 'All Status' }, 'Paid', 'Partial', 'Unpaid']} />
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Course/Term</th>
                  <th>Total Fees</th>
                  <th>Amount Paid</th>
                  <th>Due Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDues.map(due => (
                  <tr key={due.id}>
                    <td>{due.student}</td>
                    <td>{due.studentId}</td>
                    <td>{due.course}</td>
                    <td className="fw-bold">${due.totalFees.toLocaleString()}</td>
                    <td className="text-success fw-bold">${due.paid.toLocaleString()}</td>
                    <td className="text-danger fw-bold">${due.due.toLocaleString()}</td>
                    <td><span className={`badge ${statusColors[due.status] || 'bg-secondary'}`}>{due.status}</span></td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group">
                        <button className="btn btn-outline-primary">View</button>
                        {due.due > 0 && (
                          <button className="btn btn-outline-success">Collect Payment</button>
                        )}
                      </div>
                    </td>
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

export default AccountantDues;

