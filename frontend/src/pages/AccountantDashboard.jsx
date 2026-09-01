import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Wallet, Clock, FileText, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import { useAccountDashboard } from '@/hooks/useDashboard';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import {
  ChartCard,
  BarChartBox,
  PieChartBox,
  AreaChartBox,
  CHART_PALETTE,
} from '@/components/charts/Charts';
import PageHeader from '@/components/ui/PageHeader';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthKey = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const AccountantDashboard = () => {
  const { data, isLoading, isError, error, refetch } = useAccountDashboard();

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/fees');
        setFees(res.data || []);
      } catch (err) {
        setFees([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (isLoading) setLoading(true);
    else setLoading(false);
    if (isError) setErrorMsg('Failed to load financial data.');
    else setErrorMsg('');
  }, [isLoading, isError]);

  const collected = data?.balance ?? fees.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const pending = data?.pendingInvoices ?? fees
    .filter((f) => f.status === 'pending' || f.status === 'partial' || f.status === 'overdue')
    .reduce((sum, f) => sum + Math.max(0, (Number(f.amount) || 0) - (Number(f.paid) || 0)), 0);
  const totalInvoices = data?.totalInvoices ?? fees.length;
  const paidInvoices = data?.paidInvoices ?? fees.filter((f) => f.status === 'paid').length;

  const fmt = useCallback(
    (n) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n),
    []
  );

  const cards = useMemo(
    () => [
      { title: 'Fee Collection', value: collected, format: fmt, icon: Wallet, iconClass: 'bg-primary/10 text-primary' },
      { title: 'Pending Fees', value: pending, format: fmt, icon: Clock, iconClass: 'bg-warning/10 text-warning' },
      { title: 'Total Invoices', value: totalInvoices, icon: FileText, iconClass: 'bg-primary/10 text-primary' },
      { title: 'Paid Invoices', value: paidInvoices, icon: CheckCircle2, iconClass: 'bg-success/10 text-success' },
    ],
    [collected, pending, totalInvoices, paidInvoices, fmt]
  );

  const collectionByMonth = useMemo(() => {
    const buckets = {};
    fees.forEach((f) => {
      const k = monthKey(f.paidDate);
      if (!k) return;
      buckets[k] = (buckets[k] || 0) + (Number(f.paid) || 0);
    });
    const sorted = Object.keys(buckets).sort();
    let cumulative = 0;
    return sorted.map((k) => {
      cumulative += buckets[k];
      return {
        month: `${MONTH_LABELS[Number(k.split('-')[1]) - 1]} ${k.split('-')[0].slice(2)}`,
        Collected: Math.round(buckets[k]),
        Cumulative: Math.round(cumulative),
      };
    });
  }, [fees]);

  const invoiceStatusData = useMemo(() => {
    const buckets = {};
    fees.forEach((f) => {
      const key = f.status || 'pending';
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.keys(buckets).map((k) => ({ name: k, value: buckets[k] }));
  }, [fees]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accountant Dashboard"
        subtitle="Financial overview and receivables"
        breadcrumbs={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Accountant Dashboard' },
        ]}
      />
      {isError && (
        <div className="alert alert-danger">
          Couldn't load dashboard data.{' '}
          <Button variant="outline" size="sm" onClick={refetch}>Retry</Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            loading={loading}
            icon={card.icon}
            iconClass={card.iconClass}
            format={card.format}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Collection by Month" subtitle="Fee amount collected per month">
          <BarChartBox
            data={collectionByMonth}
            xKey="month"
            bars={[{ key: 'Collected', color: CHART_PALETTE[0] }]}
          />
        </ChartCard>
        <ChartCard title="Invoices by Status" subtitle="Distribution of invoice statuses">
          <PieChartBox
            data={invoiceStatusData}
            nameKey="name"
            dataKey="value"
            colors={CHART_PALETTE}
            donut
            centerLabel={`${fees.length}`}
          />
        </ChartCard>
      </div>

      <ChartCard title="Cumulative Collection" subtitle="Running total of fees collected">
        <AreaChartBox
          data={collectionByMonth}
          xKey="month"
          areas={[{ key: 'Cumulative', color: CHART_PALETTE[0] }]}
        />
      </ChartCard>

      <div className="card">
        <div className="card-header border-b border-border">
          <h5 className="card-title">Recent Invoices</h5>
        </div>
        <div className="card-body">
          {fees.length === 0 ? (
            <p className="mb-0 text-text-secondary">No invoices found.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {fees.slice(0, 6).map((f) => (
                <li className="list-group-item d-flex justify-content-between bg-transparent border-border" key={f.id}>
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
  );
};

export default AccountantDashboard;
