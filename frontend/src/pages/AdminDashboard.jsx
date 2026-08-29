import React, { useEffect, useState, useMemo } from 'react';
import { Users, GraduationCap, Clock } from 'lucide-react';
import api from '@/services/api';
import StatCard from '@/components/ui/StatCard';
import {
  ChartCard,
  BarChartBox,
  PieChartBox,
  CHART_PALETTE,
} from '@/components/charts/Charts';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthKey = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, faculty: 0, pending: 0 });
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [exams, setExams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [s, f, fe, ex, notifs] = await Promise.all([
          api.get('/students'),
          api.get('/faculty'),
          api.get('/fees'),
          api.get('/exams'),
          api.get('/notifications'),
        ]);
        const studentList = s.data || [];
        setStudents(studentList);
        setStats({
          students: studentList.length,
          faculty: (f.data || []).length,
          pending: studentList.filter((st) => st.status === 'pending').length,
        });
        setFees(fe.data || []);
        setExams(ex.data || []);
        setNotifications(notifs.data || []);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const revenueByMonth = useMemo(() => {
    const buckets = {};
    fees.forEach((fee) => {
      const k = monthKey(fee.paidDate);
      if (!k) return;
      buckets[k] = (buckets[k] || 0) + (Number(fee.paid) || 0);
    });
    return Object.keys(buckets)
      .sort()
      .map((k) => ({
        month: `${MONTH_LABELS[Number(k.split('-')[1]) - 1]} ${k.split('-')[0].slice(2)}`,
        Collected: Math.round(buckets[k]),
      }));
  }, [fees]);

  const studentsByProgram = useMemo(() => {
    const buckets = {};
    students.forEach((s) => {
      const key = s.program || 'Unspecified';
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.keys(buckets).map((k) => ({ name: k, value: buckets[k] }));
  }, [students]);

  const examsByType = useMemo(() => {
    const buckets = {};
    exams.forEach((x) => {
      const key = x.type || 'Other';
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.keys(buckets).map((k) => ({ type: k, Exams: buckets[k] }));
  }, [exams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="mt-1 text-text-secondary">Institution overview and key metrics</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Students"
          value={loading ? 0 : stats.students}
          loading={loading}
          icon={Users}
          iconClass="bg-primary/10 text-primary"
          format={(v) => v.toLocaleString()}
        />
        <StatCard
          title="Total Faculty"
          value={loading ? 0 : stats.faculty}
          loading={loading}
          icon={GraduationCap}
          iconClass="bg-[#7C3AED]/10 text-[#7C3AED]"
          format={(v) => v.toLocaleString()}
        />
        <StatCard
          title="Pending Applications"
          value={loading ? 0 : stats.pending}
          loading={loading}
          icon={Clock}
          iconClass="bg-warning/10 text-warning"
          format={(v) => v.toLocaleString()}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <div className="card">
            <div className="card-header border-b border-border">
              <h5 className="card-title">System Notifications</h5>
            </div>
            <div className="card-body">
              {notifications.length === 0 ? (
                <p className="text-sm text-text-secondary">No notifications at this time.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {notifications.map((notif) => (
                    <li key={notif.id} className="list-group-item bg-transparent text-text-secondary border-border">
                      {notif.title || notif.message || JSON.stringify(notif)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <ChartCard title="Fee Collection" subtitle="Revenue collected per month">
        <BarChartBox
          data={revenueByMonth}
          xKey="month"
          bars={[{ key: 'Collected', color: CHART_PALETTE[0] }]}
        />
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Students by Program" subtitle="Distribution across programs">
          <PieChartBox
            data={studentsByProgram}
            nameKey="name"
            dataKey="value"
            colors={CHART_PALETTE}
            donut
            centerLabel={`${stats.students} total`}
          />
        </ChartCard>
        <ChartCard title="Exams by Type" subtitle="Scheduled exams grouped by type">
          <BarChartBox
            data={examsByType}
            xKey="type"
            bars={[{ key: 'Exams', color: CHART_PALETTE[3] }]}
          />
        </ChartCard>
      </div>
    </div>
  );
};

export default AdminDashboard;
