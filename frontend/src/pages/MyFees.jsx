import { useState, useEffect, useMemo } from 'react';
import { Receipt } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

const statusColors = { paid: 'success', partial: 'warning', pending: 'info', overdue: 'danger' };
const statusLabels = { paid: 'Paid', partial: 'Partial', pending: 'Pending', overdue: 'Overdue' };

const columns = [
  { key: 'id', header: 'Invoice', width: '100px' },
  { key: 'course', header: 'Course', width: '140px' },
  { key: 'semester', header: 'Semester', width: '140px' },
  { key: 'amount', header: 'Amount', width: '120px', align: 'right', render: (v) => formatCurrency(v) },
  { key: 'paid', header: 'Paid', width: '140px', align: 'right', render: (v, row) => <span className="font-mono">{formatCurrency(v)} / {formatCurrency(row.amount)}</span> },
  { key: 'dueDate', header: 'Due Date', width: '130px', render: (v) => formatDate(v) },
  { key: 'status', header: 'Status', width: '110px', render: (v) => <Badge variant={statusColors[v]}>{statusLabels[v]}</Badge> },
];

const MyFees = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await api.get('/fees', { params: { studentId: user?.id } });
        if (active) setFees(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (active) setFees([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [user?.id]);

  const totals = useMemo(() => ({
    total: fees.reduce((s, f) => s + (Number(f.amount) || 0), 0),
    paid: fees.reduce((s, f) => s + (Number(f.paid) || 0), 0),
    due: fees.reduce((s, f) => s + ((Number(f.amount) || 0) - (Number(f.paid) || 0)), 0),
  }), [fees]);

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-text-primary">My Payments</h2>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <Card>
            <div className="text-sm text-text-secondary">Total Fees</div>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
          </Card>
        </div>
        <div className="col-md-4">
          <Card>
            <div className="text-sm text-text-secondary">Total Paid</div>
            <div className="text-2xl font-bold text-success">{formatCurrency(totals.paid)}</div>
          </Card>
        </div>
        <div className="col-md-4">
          <Card>
            <div className="text-sm text-text-secondary">Outstanding</div>
            <div className="text-2xl font-bold text-warning">{formatCurrency(totals.due)}</div>
          </Card>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">My Invoices</h5>
        </div>
        <div className="card-body">
          <Table
            columns={columns}
            data={fees}
            loading={loading}
            keyField="id"
            emptyMessage="No payments found for your account."
          />
        </div>
      </div>
    </div>
  );
};

export default MyFees;
