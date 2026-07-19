import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';

const AccountantPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetchPayments = async () => {
      try {
        const response = await api.get(`/accountant/payments`);
        setPayments(response.data);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setPayments([
          { id: 'PAY-001', student: 'John Doe', studentId: 'STU001', amount: 5000, method: 'Online', date: '2025-08-20', invoiceId: 'INV-001', status: 'Completed' },
          { id: 'PAY-002', student: 'Jane Smith', studentId: 'STU002', amount: 2500, method: 'Card', date: '2025-08-18', invoiceId: 'INV-002', status: 'Completed' },
          { id: 'PAY-003', student: 'Alice Williams', studentId: 'STU004', amount: 5000, method: 'Cash', date: '2025-08-15', invoiceId: 'INV-004', status: 'Completed' },
          { id: 'PAY-004', student: 'Bob Johnson', studentId: 'STU003', amount: 1000, method: 'Bank Transfer', date: '2025-08-10', invoiceId: 'INV-003', status: 'Partial' },
          { id: 'PAY-005', student: 'Charlie Brown', studentId: 'STU005', amount: 1000, method: 'Online', date: '2025-08-05', invoiceId: 'INV-005', status: 'Partial' },
          { id: 'PAY-006', student: 'Diana Prince', studentId: 'STU006', amount: 0, method: '-', date: '2025-08-01', invoiceId: 'INV-006', status: 'Pending' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [user]);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || payment.date === filterDate;
    const matchesMethod = filterMethod === 'all' || payment.method === filterMethod;
    return matchesSearch && matchesDate && matchesMethod;
  });

  const totalCollected = filteredPayments
    .filter(p => p.status === 'Completed' || p.status === 'Partial')
    .reduce((sum, p) => sum + p.amount, 0);

  const methodColors = {
    'Online': 'bg-primary',
    'Card': 'bg-info',
    'Cash': 'bg-success',
    'Bank Transfer': 'bg-warning text-dark',
    '-': 'bg-secondary'
  };

  if (loading) return <div className="container-fluid p-4"><div className="alert alert-info">Loading payments...</div></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Payment Records</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-primary">Record Payment</button>
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Total Collected</h5>
              <p className="display-4">${totalCollected.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Transactions</h5>
              <p className="display-4">{filteredPayments.filter(p => p.amount > 0).length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Completed</h5>
              <p className="display-4">{filteredPayments.filter(p => p.status === 'Completed').length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body text-center">
              <h5 className="card-title">Pending</h5>
              <p className="display-4">{filteredPayments.filter(p => p.status === 'Pending').length}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="row mb-4 g-2">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="date"
            className="form-control"
            placeholder="Filter by date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={filterMethod} onChange={e => setFilterMethod(e.target.value)}>
            <option value="all">All Methods</option>
            <option value="Online">Online</option>
            <option value="Card">Card</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(payment => (
                  <tr key={payment.id}>
                    <td>{payment.id}</td>
                    <td>{payment.student}</td>
                    <td>{payment.studentId}</td>
                    <td>{payment.invoiceId}</td>
                    <td className="fw-bold ${payment.amount > 0 ? 'text-success' : 'text-muted'}">
                      {payment.amount > 0 ? `$${payment.amount.toLocaleString()}` : '-'}
                    </td>
                    <td>
                      <span className={`badge ${methodColors[payment.method] || 'bg-secondary'}`}>
                        {payment.method}
                      </span>
                    </td>
                    <td>{payment.date}</td>
                    <td>
                      {payment.status === 'Completed' && <span className="badge bg-success">Completed</span>}
                      {payment.status === 'Partial' && <span className="badge bg-warning text-dark">Partial</span>}
                      {payment.status === 'Pending' && <span className="badge bg-secondary">Pending</span>}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary">View Receipt</button>
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

export default AccountantPayments;

