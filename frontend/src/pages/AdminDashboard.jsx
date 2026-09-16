import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Users, GraduationCap, Clock, TrendingUp, BookOpen, Calendar, Award, UserPlus, RotateCcw, RefreshCw, AlertTriangle, Grid, Loader2 } from "lucide-react";
import api from "@/services/api";
import StatCard from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ChartCard,
  BarChartBox,
  PieChartBox,
  CHART_PALETTE,
} from "@/components/charts/Charts";
import { useToast } from "@/context/ToastContext";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const monthKey = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const AdminDashboard = () => {
  const { success } = useToast();
  const [stats, setStats] = useState({ students: 0, faculty: 0, pending: 0 });
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Timetable generation state
  const [generating, setGenerating] = useState(false);
  const [diffResult, setDiffResult] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [conflicts, setConflicts] = useState(null);
  const [showConflicts, setShowConflicts] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/timetable/generate');
      setDiffResult(res.data);
      setShowDiff(true);
      success(`Timetable ${res.data.status === 'generated' ? 'generated' : 'adjusted'} successfully`);
    } catch (err) {
      success('Generation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleAdjust = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/timetable/adjust');
      setDiffResult(res.data);
      setShowDiff(true);
      success('Timetable adjusted successfully');
    } catch (err) {
      success('Adjust failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleConflicts = async () => {
    try {
      const res = await api.get('/timetable/conflicts');
      setConflicts(res.data);
      setShowConflicts(true);
    } catch (err) {
      success('Failed to load conflicts');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [s, f, fe, notifs] = await Promise.all([
          api.get("/students"),
          api.get("/teachers"),
          api.get("/fees"),
          api.get("/notifications"),
        ]);
        const studentList = s.data || [];
        setStudents(studentList);
        setStats({
          students: studentList.length,
          faculty: (f.data || []).length,
          pending: studentList.filter((st) => st.status === "pending").length,
        });
        setFees(fe.data || []);
        setNotifications(notifs.data || []);
      } catch (err) {
        setError("Failed to load dashboard data.");
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
        month: `${MONTH_LABELS[Number(k.split("-")[1]) - 1]} ${k.split("-")[0].slice(2)}`,
        Collected: Math.round(buckets[k]),
      }));
  }, [fees]);

  const studentsByProgram = useMemo(() => {
    const buckets = {};
    students.forEach((s) => {
      const key = s.program || "Unspecified";
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.keys(buckets).map((k) => ({ name: k, value: buckets[k] }));
  }, [students]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const recentNotifications = useMemo(
    () => notifications.slice(0, 5),
    [notifications]
  );

  const formatNumber = useCallback(
    (v) => v.toLocaleString(),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-text-tertiary">
        <Calendar className="h-4 w-4" />
        <span>{today}</span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title="Students by Program" subtitle="Distribution across programs" className="card-premium">
            <PieChartBox
              data={studentsByProgram}
              nameKey="name"
              dataKey="value"
              colors={CHART_PALETTE}
              donut
              centerLabel={`${stats.students} total`}
            />
          </ChartCard>
        </div>

        <div className="space-y-4">
          <StatCard
            title="Total Students"
            value={loading ? 0 : stats.students}
            loading={loading}
            icon={Users}
            iconClass="bg-emerald-500/10 text-emerald-500"
            format={formatNumber}
            trend="+12%"
            trendUp={true}
          />
          <StatCard
            title="Total Teachers"
            value={loading ? 0 : stats.faculty}
            loading={loading}
            icon={GraduationCap}
            iconClass="bg-violet-500/10 text-violet-500"
            format={formatNumber}
            trend="+5%"
            trendUp={true}
          />
          <StatCard
            title="Pending Applications"
            value={loading ? 0 : stats.pending}
            loading={loading}
            icon={Clock}
            iconClass="bg-emerald-500/10 text-emerald-500"
            format={formatNumber}
            trend="-8%"
            trendUp={false}
          />
        </div>
      </div>

      <ChartCard title="Fee Collection" subtitle="Revenue collected per month" className="card-premium">
        <BarChartBox
          data={revenueByMonth}
          xKey="month"
          bars={[{ key: "Collected", color: CHART_PALETTE[2] }]}
        />
      </ChartCard>

      <div className="card-premium">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <h5 className="font-display text-base font-semibold text-text-primary">System Notifications</h5>
            {notifications.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                {notifications.length}
              </span>
            )}
          </div>
        </div>
        <div className="p-5">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.03] mb-3">
                <Calendar className="h-6 w-6 text-text-tertiary" />
              </div>
              <p className="text-sm text-text-secondary">No notifications at this time</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentNotifications.map((notif) => (
                <li key={notif.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{notif.title || notif.message || JSON.stringify(notif)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;