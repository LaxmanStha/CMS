import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';

const AccountantInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchInvoices = async () => {
      try {
        const response = await api.get(`/accountant/invoices`);
        setInvoices(response.data);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setInvoices([
          { id: 'INV-001', student: 'John Doe', studentId: 'STU001', course: 'Fall 2025', amount: 5000, status: 'Paid', date: '2025-08-15', dueDate: '2025-09-01' },
          { id: 'INV-002', student: 'Jane Smith', studentId: 'STU002', course: 'Fall 2025', amount: 5000, status: 'Pending', date: '2025-08-15', dueDate: '2025-09-01' },
          { id: 'INV-003', student: 'Bob Johnson', studentId: 'STU003', course: 'Fall 2025', amount: 5000, status: 'Overdue', date: '2025-08-15', dueDate: '2025-09-01' },
          { id: 'INV-004', student: 'Alice Williams', studentId: 'STU004', course: 'Fall 2025', amount: 5000, status: 'Paid', date: '2025-08-15', dueDate: '2025-09-01' },
          { id: 'INV-005', student: 'Charlie Brown', studentId: 'STU005', course: 'Fall 2025', amount: 5000, status: 'Pending', date: '2025-08-15', dueDate: '2025-09-01' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [user]);

  const filteredInvoices = invoices.filter(inv =>
    inv.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    Paid: 'bg-success',
    Pending: 'bg-warning text-dark',
    Overdue: 'bg-danger',
    Cancelled: 'bg-secondary'
  };

  if (loading) return <div className="container-fluid p-4"><div className="alert alert-info">Loading invoices...</div></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Invoices</h2>
        <button className="btn btn-primary">Generate Invoice</button>
      </div>
      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Course/Term</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>{invoice.id}</td>
                    <td>{invoice.student}</td>
                    <td>{invoice.studentId}</td>
                    <td>{invoice.course}</td>
                    <td className="fw-bold">${invoice.amount.toLocaleString()}</td>
                    <td><span className={`badge ${statusColors[invoice.status] || 'bg-secondary'}`}>{invoice.status}</span></td>
                    <td>{invoice.date}</td>
                    <td>{invoice.dueDate}</td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group">
                        <button className="btn btn-outline-primary">View</button>
                        <button className="btn btn-outline-secondary">Edit</button>
                        {invoice.status !== 'Paid' && (
                          <button className="btn btn-outline-success">Mark Paid</button>
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

export default AccountantInvoices;

