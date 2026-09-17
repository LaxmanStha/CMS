import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import { formatCurrency } from '@/lib/utils';

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

  const summary = useMemo(() => filteredDues.reduce((acc, due) => {
    acc.totalFees += due.totalFees || 0;
    acc.totalPaid += due.paid || 0;
    acc.totalDue += due.due || 0;
    return acc;
  }, { totalFees: 0, totalPaid: 0, totalDue: 0 }), [filteredDues]);

  const statusColors = {
    Paid: 'success',
    Partial: 'warning',
    Unpaid: 'danger'
  };

  if (loading) return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
          <span className="ml-2" style={{ color: 'var(--color-text-muted)' }}>Loading dues...</span>
        </div>
      </Card>
    </div>
  );

  const columns = [
    { key: 'student', header: 'Student' },
    { key: 'studentId', header: 'Student ID', width: '120px' },
    { key: 'course', header: 'Course/Term', width: '140px' },
    { key: 'totalFees', header: 'Total Fees', width: '120px', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'paid', header: 'Amount Paid', width: '120px', align: 'right', render: (v) => <span className="font-bold" style={{ color: 'var(--color-success)' }}>{formatCurrency(v)}</span> },
    { key: 'due', header: 'Due Amount', width: '120px', align: 'right', render: (v) => <span className="font-bold" style={{ color: 'var(--color-danger)' }}>{formatCurrency(v)}</span> },
    { key: 'status', header: 'Status', width: '100px', render: (v) => <Badge variant={statusColors[v] || 'default'}>{v}</Badge> },
    { key: 'actions', header: 'Actions', width: '160px', render: (v, row) => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">View</Button>
        {row.due > 0 && <Button variant="success" size="sm">Collect Payment</Button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 text-center" style={{ backgroundColor: 'var(--color-accent-muted)', border: '1px solid var(--color-accent)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Fees</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>${summary.totalFees.toLocaleString()}</p>
        </Card>
        <Card className="p-6 text-center" style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', border: '1px solid var(--color-success)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Paid</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>${summary.totalPaid.toLocaleString()}</p>
        </Card>
        <Card className="p-6 text-center" style={{ backgroundColor: 'rgba(202, 138, 4, 0.1)', border: '1px solid var(--color-warning)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Due</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>${summary.totalDue.toLocaleString()}</p>
        </Card>
        <Card className="p-6 text-center" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--color-info)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Collection Rate</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-info)' }}>{summary.totalFees > 0 ? ((summary.totalPaid / summary.totalFees) * 100).toFixed(1) : 0}%</p>
        </Card>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Search students..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Dropdown
          value={filterStatus}
          onChange={setFilterStatus}
          options={[{ value: 'all', label: 'All Status' }, 'Paid', 'Partial', 'Unpaid']}
        />
      </div>
      <Card>
        <Card.Header>
          <Card.Title>Student Dues</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="table-container">
            <table className="table">
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
                    <td className="font-bold" style={{ color: 'var(--color-text-primary)' }}>${(due.totalFees || 0).toLocaleString()}</td>
                    <td className="font-bold" style={{ color: 'var(--color-success)' }}>${(due.paid || 0).toLocaleString()}</td>
                    <td className="font-bold" style={{ color: 'var(--color-danger)' }}>${(due.due || 0).toLocaleString()}</td>
                    <td><Badge variant={statusColors[due.status] || 'default'}>{due.status}</Badge></td>
                    <td>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">View</Button>
                        {due.due > 0 && <Button variant="success" size="sm">Collect Payment</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default AccountantDues;