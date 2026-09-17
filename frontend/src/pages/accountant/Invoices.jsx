import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { formatCurrency, formatDate } from '@/lib/utils';

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

  const statusVariants = {
    Paid: 'success',
    Pending: 'warning',
    Overdue: 'danger',
    Cancelled: 'default'
  };

  const columns = useMemo(() => [
    { key: 'id', header: 'Invoice ID', width: '100px' },
    { key: 'student', header: 'Student' },
    { key: 'studentId', header: 'Student ID', width: '120px' },
    { key: 'course', header: 'Course/Term', width: '140px' },
    { key: 'amount', header: 'Amount', width: '120px', align: 'right', render: (v) => formatCurrency(v) },
    { key: 'status', header: 'Status', width: '100px', render: (v) => <Badge variant={statusVariants[v] || 'default'}>{v}</Badge> },
    { key: 'date', header: 'Issue Date', width: '120px', render: (v) => formatDate(v) },
    { key: 'dueDate', header: 'Due Date', width: '120px', render: (v) => formatDate(v) },
    { key: 'actions', header: 'Actions', width: '180px', render: (v, row) => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">View</Button>
        <Button variant="ghost" size="sm">Edit</Button>
        {row.status !== 'Paid' && <Button variant="success" size="sm">Mark Paid</Button>}
      </div>
    )},
  ], []);

  if (loading) return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
          <span className="ml-2" style={{ color: 'var(--color-text-muted)' }}>Loading invoices...</span>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button>Generate Invoice</Button>
      </div>
      <Card>
        <Card.Header>
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </Card.Header>
        <Card.Content>
          <Table
            columns={columns}
            data={filteredInvoices}
            keyField="id"
            searchable={false}
            filterable={false}
            paginated
            pageSize={10}
            emptyMessage="No invoices found"
          />
        </Card.Content>
      </Card>
    </div>
  );
};

export default AccountantInvoices;