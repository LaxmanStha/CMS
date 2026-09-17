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
import { Card } from '@/components/ui/Card';

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
      { title: 'Fee Collection', value: collected, format: fmt, icon: Wallet, iconClass: 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]' },
      { title: 'Pending Fees', value: pending, format: fmt, icon: Clock, iconClass: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' },
      { title: 'Total Invoices', value: totalInvoices, icon: FileText, iconClass: 'bg-[var(--color-info)]/10 text-[var(--color-info)]' },
      { title: 'Paid Invoices', value: paidInvoices, icon: CheckCircle2, iconClass: 'bg-[var(--color-success)]/10 text-[var(--color-success)]' },
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
      {isError && (
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.3)', color: 'var(--color-danger)' }}>
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

      <Card>
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h5 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recent Invoices</h5>
        </div>
        <div className="p-6">
          {fees.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No invoices found.</p>
          ) : (
            <ul className="space-y-2">
              {fees.slice(0, 6).map((f) => (
                <li key={f.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                  <span>{f.student} - {f.course}</span>
                  <span className={`badge ${f.status === 'paid' ? 'badge-success' : f.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                    {f.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AccountantDashboard;