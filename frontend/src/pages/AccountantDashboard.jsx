import React, { useEffect, useState } from 'react';
import api from '@/services/api';

const AccountantDashboard = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/fees');
        setFees(res.data || []);
      } catch (err) {
        setError('Failed to load financial data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const collected = fees.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const pending = fees
    .filter((f) => f.status === 'pending' || f.status === 'partial' || f.status === 'overdue')
    .reduce((sum, f) => sum + Math.max(0, (Number(f.amount) || 0) - (Number(f.paid) || 0)), 0);

  const fmt = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const cards = [
    { title: 'Fee Collection', value: fmt(collected) },
    { title: 'Pending Fees', value: fmt(pending) },
    { title: 'Total Invoices', value: fees.length },
    { title: 'Paid Invoices', value: fees.filter((f) => f.status === 'paid').length },
  ];

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Accountant Dashboard</h2>
        <div>
          <button className="btn btn-outline-secondary me-2">Profile</button>
          <button className="btn btn-primary">Logout</button>
        </div>
      </div>
      {error && <div className="alert alert-danger mb-3">{error}</div>}
      <div className="row">
        {cards.map((card) => (
          <div className="col-md-3" key={card.title}>
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{card.title}</h5>
                <p className="display-5">{loading ? '...' : card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="row mt-4">
        <div className="col-md-12">
          <div className="card dark-card">
            <div className="card-header border-white/10">
              <h5 className="card-title text-white mb-0">Recent Invoices</h5>
            </div>
            <div className="card-body">
              {fees.length === 0 ? (
                <p className="text-white/60 mb-0">No invoices found.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {fees.slice(0, 6).map((f) => (
                    <li className="list-group-item d-flex justify-content-between bg-transparent text-white/80 border-white/10" key={f.id}>
                      <span>{f.student} - {f.course}</span>
                      <span className={`badge bg-${f.status === 'paid' ? 'success' : f.status === 'overdue' ? 'danger' : 'warning'}`}>
                        {f.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
