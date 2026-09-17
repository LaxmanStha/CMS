import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import Dropdown from '@/components/ui/Dropdown';
import { formatCurrency, formatDate } from '@/lib/utils';

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

  const methodVariants = {
    'Online': 'primary',
    'Card': 'info',
    'Cash': 'success',
    'Bank Transfer': 'warning',
    '-': 'default'
  };

  const statusVariants = {
    'Completed': 'success',
    'Partial': 'warning',
    'Pending': 'default'
  };

  const columns = useMemo(() => [
    { key: 'id', header: 'Payment ID', width: '100px' },
    { key: 'student', header: 'Student' },
    { key: 'studentId', header: 'Student ID', width: '120px' },
    { key: 'invoiceId', header: 'Invoice', width: '100px' },
    { key: 'amount', header: 'Amount', width: '120px', align: 'right', render: (v, row) => v > 0 ? <span className="font-bold" style={{ color: 'var(--color-success)' }}>{formatCurrency(v)}</span> : '-' },
    { key: 'method', header: 'Method', width: '130px', render: (v) => <Badge variant={methodVariants[v] || 'default'}>{v}</Badge> },
    { key: 'date', header: 'Date', width: '120px', render: (v) => formatDate(v) },
    { key: 'status', header: 'Status', width: '100px', render: (v) => <Badge variant={statusVariants[v] || 'default'}>{v}</Badge> },
    { key: 'actions', header: 'Actions', width: '140px', render: () => <Button variant="outline" size="sm">View Receipt</Button> },
  ], []);

  if (loading) return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
          <span className="ml-2" style={{ color: 'var(--color-text-muted)' }}>Loading payments...</span>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2">
          <Button>Record Payment</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 text-center" style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', border: '1px solid var(--color-success)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Collected</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>${totalCollected.toLocaleString()}</p>
        </Card>
        <Card className="p-6 text-center" style={{ backgroundColor: 'var(--color-accent-muted)', border: '1px solid var(--color-accent)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Transactions</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{filteredPayments.filter(p => p.amount > 0).length}</p>
        </Card>
        <Card className="p-6 text-center" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--color-info)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Completed</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-info)' }}>{filteredPayments.filter(p => p.status === 'Completed').length}</p>
        </Card>
        <Card className="p-6 text-center" style={{ backgroundColor: 'rgba(202, 138, 4, 0.1)', border: '1px solid var(--color-warning)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Pending</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>{filteredPayments.filter(p => p.status === 'Pending').length}</p>
        </Card>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          placeholder="Search payments..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Input
          type="date"
          placeholder="Filter by date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="w-auto min-w-[160px]"
        />
        <Dropdown
          value={filterMethod}
          onChange={setFilterMethod}
          options={[{ value: 'all', label: 'All Methods' }, 'Online', 'Card', 'Cash', 'Bank Transfer']}
        />
      </div>
      <Card>
        <Card.Content>
          <Table
            columns={columns}
            data={filteredPayments}
            keyField="id"
            searchable={false}
            filterable={false}
            paginated
            pageSize={10}
            emptyMessage="No payments found"
          />
        </Card.Content>
      </Card>
    </div>
  );
};

export default AccountantPayments;